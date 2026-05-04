const { verifyAccess } = require('../utils/jwt');
const AppError = require('../errors/AppError');

function extractToken(req) {
  const cookieToken = req.cookies?.accessToken;
  if (cookieToken) return cookieToken;
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
}

function authenticate(req, _res, next) {
  try {
    const token = extractToken(req);
    if (!token) throw new AppError('Unauthenticated', 401);

    const payload = verifyAccess(token);
    req.user = {
      id: payload.id ?? payload.sub,
      email: payload.email,
      role: payload.role,
    };
    if (!req.user.id || !req.user.role) throw new AppError('Invalid token payload', 401);

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') return next(new AppError('Token expired', 401));
    if (err.name === 'JsonWebTokenError') return next(new AppError('Invalid token', 401));
    next(err);
  }
}

function optionalAuth(req, _res, next) {
  const token = extractToken(req);
  if (!token) return next();
  try {
    const payload = verifyAccess(token);
    req.user = {
      id: payload.id ?? payload.sub,
      email: payload.email,
      role: payload.role,
    };
  } catch {
    // ignore — treated as anonymous
  }
  next();
}

function authorize(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(new AppError('Unauthenticated', 401));
    if (!roles.includes(req.user.role)) return next(new AppError('Forbidden', 403));
    next();
  };
}

module.exports = { authenticate, optionalAuth, authorize };
