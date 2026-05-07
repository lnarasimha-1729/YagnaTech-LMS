const authService = require('./auth.service');
const passwordService = require('./password.service');
const { Application } = require('../../models');
const env = require('../../config/env');
const asyncHandler = require('../../shared/utils/asyncHandler');

const isTruthy = (v) => v === true || v === '1' || v === 'true' || v === 1;

exports.register = asyncHandler(async (req, res) => {
  const user = await authService.register(req.body);

  // Optional instructor-application (RegisteredUserController::store behaviour).
  if (isTruthy(req.body.instructor)) {
    const existing = await Application.findOne({ where: { user_id: user.id } });
    if (!existing) {
      await Application.create({
        user_id: user.id,
        type: 'instructor',
        payload: JSON.stringify({
          phone: req.body.phone || null,
          description: req.body.description || null,
          // File uploads handled by a dedicated multipart route — omitted here for parity.
        }),
        status: 0,
      });
    }
  }

  if (env.studentEmailVerification) {
    passwordService
      .sendVerificationEmail(user)
      .catch((e) => console.error('[register] verification email failed:', e));
  }
  res.status(201).json(authService.issueTokens(user));
});

exports.login = asyncHandler(async (req, res) => {
  res.json(
    await authService.login({
      email: req.body.email,
      password: req.body.password,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] || '',
    })
  );
});

exports.logout = asyncHandler(async (req, res) => {
  await authService.logout({ user: req.user, userAgent: req.headers['user-agent'] || '' });
  res.json({ message: 'Logged out' });
});

exports.refresh = asyncHandler(async (req, res) => {
  res.json(await authService.refresh(req.body.refreshToken));
});

exports.me = (req, res) => {
  res.json({ user: authService.sanitize(req.user) });
};

exports.forgotPassword = asyncHandler(async (req, res) => {
  res.json(await passwordService.sendResetLink(req.body.email));
});

exports.resetPassword = asyncHandler(async (req, res) => {
  res.json(await passwordService.resetPassword(req.body));
});

exports.verifyEmail = asyncHandler(async (req, res) => {
  res.json(await passwordService.verifyEmail(req.params));
});

exports.resendVerification = asyncHandler(async (req, res) => {
  await passwordService.sendVerificationEmail(req.user);
  res.json({ message: 'Verification email sent' });
});

exports.changePassword = asyncHandler(async (req, res) => {
  res.json(
    await authService.changePassword({
      user: req.user,
      currentPassword: req.body.current_password,
      newPassword: req.body.password,
    })
  );
});

exports.confirmPassword = asyncHandler(async (req, res) => {
  res.json(await authService.confirmPassword({ user: req.user, password: req.body.password }));
});

exports.verifyDevice = asyncHandler(async (req, res) => {
  res.json(await authService.confirmNewDevice(req.body.fingerprint));
});
