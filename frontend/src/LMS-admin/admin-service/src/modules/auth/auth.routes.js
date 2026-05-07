const router = require('express').Router();
const rateLimit = require('express-rate-limit');

const validate = require('../../shared/middleware/validate.middleware');
const { authenticate } = require('../../shared/middleware/auth.middleware');
const v = require('./auth.validators');
const c = require('./auth.controller');

// Throttle credential-sensitive endpoints by IP+email so account enumeration doesn't
// let one IP burn through an entire bucket for a given email.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `${req.ip}|${(req.body && req.body.email) || ''}`,
});
const forgotLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `${req.ip}|${(req.body && req.body.email) || ''}`,
});

// Public
router.post('/register', authLimiter, validate(v.register), c.register);
router.post('/login', authLimiter, validate(v.login), c.login);
router.post('/refresh', validate(v.refresh), c.refresh);
router.post('/forgot-password', forgotLimiter, validate(v.forgot), c.forgotPassword);
router.post('/reset-password', authLimiter, validate(v.reset), c.resetPassword);
router.get('/verify-email/:id/:hash', c.verifyEmail);
// Called when the user clicks the new-device confirmation link emailed at login.
router.post('/verify-device', authLimiter, validate(v.verifyDevice), c.verifyDevice);

// Authenticated
router.post('/logout', authenticate, c.logout);
router.get('/me', authenticate, c.me);
router.post('/email/verification-notification', authenticate, c.resendVerification);
router.put('/password', authenticate, validate(v.changePassword), c.changePassword);
router.post('/confirm-password', authenticate, validate(v.confirmPassword), c.confirmPassword);

module.exports = router;
