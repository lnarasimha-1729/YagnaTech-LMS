const { z } = require('zod');

// Mirrors Laravel Rules\Password::defaults(): min 8, letter + digit.
const passwordRule = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Za-z]/, 'Password must contain a letter')
  .regex(/[0-9]/, 'Password must contain a number');

const register = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email().max(255),
  password: passwordRule,
  // Optional instructor-application bundle (matches RegisteredUserController::store).
  instructor: z.union([z.boolean(), z.literal('1'), z.literal('0'), z.literal('true'), z.literal('false')]).optional(),
  phone: z.string().max(50).optional(),
  description: z.string().max(2000).optional(),
});

const login = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const forgot = z.object({ email: z.string().email() });

const reset = z
  .object({
    token: z.string().min(1),
    email: z.string().email(),
    password: passwordRule,
    password_confirmation: z.string(),
  })
  .refine((d) => d.password === d.password_confirmation, {
    message: 'Password confirmation does not match',
    path: ['password_confirmation'],
  });

const refresh = z.object({ refreshToken: z.string().min(1) });

const changePassword = z
  .object({
    current_password: z.string().min(1),
    password: passwordRule,
    password_confirmation: z.string(),
  })
  .refine((d) => d.password === d.password_confirmation, {
    message: 'Password confirmation does not match',
    path: ['password_confirmation'],
  });

const confirmPassword = z.object({ password: z.string().min(1) });

const verifyDevice = z.object({ fingerprint: z.string().min(1) });

module.exports = {
  register,
  login,
  forgot,
  reset,
  refresh,
  changePassword,
  confirmPassword,
  verifyDevice,
};
