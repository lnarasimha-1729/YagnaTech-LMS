const AppError = require('../errors/AppError');

/** Runs a Zod schema against req.body / .query / .params and 422s on failure. */
module.exports = (schema, source = 'body') => (req, _res, next) => {
  const parsed = schema.safeParse(req[source]);
  if (!parsed.success) {
    return next(new AppError('Validation failed', 422, parsed.error.flatten().fieldErrors));
  }
  req[source] = parsed.data;
  next();
};
