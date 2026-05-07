const bcrypt = require('bcrypt');
const { User, PasswordResetToken } = require('../../models');
const { randomToken, sha1 } = require('../../shared/utils/token');
const { hashPassword } = require('../../shared/utils/hash');
const { sendMail } = require('../../shared/mail/mail.service');
const AppError = require('../../shared/errors/AppError');
const env = require('../../config/env');

const TOKEN_TTL_MINUTES = 60;

async function sendResetLink(email) {
  const user = await User.findOne({ where: { email } });
  // Enumeration-safe: identical response whether or not the email exists.
  if (!user) return { status: 'If the email exists, a reset link has been sent.' };

  const rawToken = randomToken(32);
  const hashed = await bcrypt.hash(rawToken, 10);

  await PasswordResetToken.upsert({ email, token: hashed, created_at: new Date() });

  const link = `${env.frontendUrl}/reset-password?token=${rawToken}&email=${encodeURIComponent(email)}`;
  await sendMail({
    to: email,
    subject: 'Password reset',
    html: `<p>Reset your password (valid for ${TOKEN_TTL_MINUTES} minutes):</p>
           <p><a href="${link}">${link}</a></p>`,
  });

  return { status: 'If the email exists, a reset link has been sent.' };
}

async function resetPassword({ token, email, password }) {
  const row = await PasswordResetToken.findOne({ where: { email } });
  if (!row) throw new AppError('This password reset token is invalid.', 400);

  const ageMinutes = (Date.now() - new Date(row.created_at).getTime()) / 60000;
  if (ageMinutes > TOKEN_TTL_MINUTES) {
    await row.destroy();
    throw new AppError('This password reset token has expired.', 400);
  }

  const ok = await bcrypt.compare(token, row.token);
  if (!ok) throw new AppError('This password reset token is invalid.', 400);

  const user = await User.scope('withSecrets').findOne({ where: { email } });
  if (!user) throw new AppError('User not found.', 404);

  await user.update({
    password: await hashPassword(password),
    remember_token: randomToken(30),
  });
  await row.destroy();

  return { status: 'Your password has been reset.' };
}

async function sendVerificationEmail(user) {
  // Matches Laravel: hash_equals(route('hash'), sha1(email))
  const hash = sha1(user.email);
  const link = `${env.appUrl}/api/auth/verify-email/${user.id}/${hash}`;
  await sendMail({
    to: user.email,
    subject: 'Verify your email',
    html: `<p>Click to verify your email:</p><p><a href="${link}">${link}</a></p>`,
  });
}

async function verifyEmail({ id, hash }) {
  const user = await User.findByPk(id);
  if (!user) throw new AppError('Invalid verification link.', 403);
  if (sha1(user.email) !== hash) {
    throw new AppError('Invalid or expired verification link.', 403);
  }
  if (user.email_verified_at) return { status: 'already-verified' };
  await user.update({ email_verified_at: new Date() });
  return { status: 'verified' };
}

module.exports = { sendResetLink, resetPassword, sendVerificationEmail, verifyEmail };
