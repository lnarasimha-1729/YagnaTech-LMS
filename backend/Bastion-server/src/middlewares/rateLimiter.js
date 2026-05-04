// src/middlewares/rateLimiter.js
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 2000, // per IP
  message: { error: 'Too many requests, please try again later.' },
});

export default limiter;
