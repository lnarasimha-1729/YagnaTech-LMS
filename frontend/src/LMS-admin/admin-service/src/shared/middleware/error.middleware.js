const env = require('../../config/env');
const AppError = require('../errors/AppError');

// eslint-disable-next-line no-unused-vars
module.exports = (err, _req, res, _next) => {
  const isAppError = err instanceof AppError;
  const status = isAppError ? err.statusCode : 500;

  const body = {
    error: err.message || 'Internal Server Error',
    ...(isAppError && err.details ? { details: err.details } : {}),
  };

  if (!isAppError) {
    console.error(err);
    if (env.nodeEnv !== 'production') body.stack = err.stack;
  }

  // Sequelize validation / unique constraint shortcuts
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({ error: 'Duplicate value', details: err.errors?.map((e) => e.message) });
  }
  if (err.name === 'SequelizeValidationError') {
    return res.status(422).json({ error: 'Validation failed', details: err.errors?.map((e) => e.message) });
  }

  res.status(status).json(body);
};
