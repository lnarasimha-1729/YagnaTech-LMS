const { User, DeviceIp } = require('../../models');
const { hashPassword, verifyPassword } = require('../../shared/utils/hash');
const { signAccess, signRefresh, verifyRefresh } = require('../../shared/utils/jwt');
const { deviceFingerprint, randomToken } = require('../../shared/utils/token');
const { sendMail } = require('../../shared/mail/mail.service');
const AppError = require('../../shared/errors/AppError');
const env = require('../../config/env');

async function register({ name, email, password }) {
  const existing = await User.findOne({ where: { email } });
  if (existing) throw new AppError('Email is already taken', 409);

  return User.create({
    name,
    email,
    role: 'student',
    status: 1,
    password: await hashPassword(password),
    email_verified_at: env.studentEmailVerification ? null : new Date(),
  });
}

/**
 * Login with Laravel-parity device-limit logic.
 * - Admins bypass device tracking.
 * - When over the device limit: instead of a flat 403, email a new-device
 *   confirmation link (matches AuthenticatedSessionController::store) and
 *   surface a 403 with { code: 'new-device-confirmation-sent' }.
 */
async function login({ email, password, ipAddress, userAgent }) {
  const user = await User.scope('withSecrets').findOne({ where: { email } });
  if (!user) throw new AppError('These credentials do not match our records.', 401);

  const ok = await verifyPassword(password, user.password);
  if (!ok) throw new AppError('These credentials do not match our records.', 401);
  if (user.status !== 1) throw new AppError('Account disabled', 403);

  if (user.role !== 'admin') {
    const fp = deviceFingerprint(user.id, userAgent);
    const devices = await DeviceIp.findAll({ where: { user_id: user.id } });
    const sameDevice = devices.find((d) => d.user_agent === fp);
    const otherDevices = devices.filter((d) => d.user_agent !== fp);

    if (otherDevices.length >= env.deviceLimitation && !sameDevice) {
      // Over limit on a new device — send confirmation email, reject this login.
      await sendNewDeviceConfirmation(user, otherDevices[0]).catch((e) =>
        console.error('[login] new-device email failed:', e)
      );
      throw new AppError(
        'A confirmation email has been sent. Please confirm access from another device, or sign out from an existing one first.',
        403,
        { code: 'new-device-confirmation-sent' }
      );
    }

    if (sameDevice) {
      await sameDevice.update({ ip_address: ipAddress, updated_at: new Date() });
    } else {
      await DeviceIp.create({
        user_id: user.id,
        ip_address: ipAddress,
        user_agent: fp,
        session_id: randomToken(20),
      });
    }
  }

  return issueTokens(user);
}

async function logout({ user, userAgent }) {
  if (!user) return;
  const fp = deviceFingerprint(user.id, userAgent);
  await DeviceIp.destroy({ where: { user_id: user.id, user_agent: fp } });
}

async function refresh(refreshToken) {
  let payload;
  try {
    payload = verifyRefresh(refreshToken);
  } catch {
    throw new AppError('Invalid refresh token', 401);
  }
  const user = await User.findByPk(payload.sub);
  if (!user) throw new AppError('Invalid refresh token', 401);
  return issueTokens(user);
}

/** Change password for an authenticated user — mirrors Auth/PasswordController::update. */
async function changePassword({ user, currentPassword, newPassword }) {
  const full = await User.scope('withSecrets').findByPk(user.id);
  if (!full) throw new AppError('User not found', 404);

  const ok = await verifyPassword(currentPassword, full.password);
  if (!ok) throw new AppError('Current password is incorrect', 422, { current_password: ['Current password is incorrect'] });

  await full.update({
    password: await hashPassword(newPassword),
    remember_token: randomToken(30),
  });
  return { status: 'password-updated' };
}

/** Confirm-password — re-verify the current user's password without changing it. */
async function confirmPassword({ user, password }) {
  const full = await User.scope('withSecrets').findByPk(user.id);
  if (!full) throw new AppError('User not found', 404);
  const ok = await verifyPassword(password, full.password);
  if (!ok) throw new AppError('The provided password is incorrect.', 422, { password: ['The provided password is incorrect.'] });
  return { status: 'confirmed', confirmedAt: new Date().toISOString() };
}

/**
 * Called when a user clicks the new-device confirmation link emailed at login.
 * Removes the oldest device row for that fingerprint so the user can re-login
 * from their new device. Matches the Laravel `?user_agent=…` flow where the
 * oldest row is deleted.
 */
async function confirmNewDevice(fingerprint) {
  if (!fingerprint) throw new AppError('Missing device fingerprint', 400);
  const row = await DeviceIp.findOne({ where: { user_agent: fingerprint }, order: [['id', 'ASC']] });
  if (!row) throw new AppError('This confirmation link is invalid or already used.', 400);
  await row.destroy();
  return { status: 'device-confirmed' };
}

function issueTokens(user) {
  const payload = { sub: user.id, role: user.role };
  return {
    user: sanitize(user),
    accessToken: signAccess(payload),
    refreshToken: signRefresh(payload),
  };
}

function sanitize(user) {
  const plain = user.toJSON();
  delete plain.password;
  delete plain.remember_token;
  return plain;
}

async function sendNewDeviceConfirmation(user, oldestDevice) {
  const fp = oldestDevice?.user_agent;
  if (!fp) return;
  const link = `${env.frontendUrl}/login?verify_device=${encodeURIComponent(fp)}`;
  await sendMail({
    to: user.email,
    subject: 'New device login confirmation',
    html: `<p>Hi ${user.name || ''},</p>
           <p>We noticed a sign-in attempt from a new device. If this was you, click below to confirm
           and sign out the oldest existing session:</p>
           <p><a href="${link}">${link}</a></p>
           <p>If you didn't attempt this, you can safely ignore this email.</p>`,
  });
}

module.exports = {
  register,
  login,
  logout,
  refresh,
  changePassword,
  confirmPassword,
  confirmNewDevice,
  issueTokens,
  sanitize,
};
