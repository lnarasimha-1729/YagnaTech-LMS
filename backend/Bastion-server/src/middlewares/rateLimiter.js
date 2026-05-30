// src/middlewares/rateLimiter.js
import rateLimit from 'express-rate-limit';

const ONE_MINUTE_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 2000;

const rateLimiter = rateLimit({
  windowMs: ONE_MINUTE_MS,
  max: MAX_REQUESTS_PER_WINDOW,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

export default rateLimiter;
