const jwt = require('jsonwebtoken');
const env = require('../config/env');

const auth = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;
        if (!token) return res.status(401).json({ error: 'Unauthorized - No token provided' });

        const decoded = jwt.verify(token, env.jwt.secret);
        req.user = decoded;
        next();
    } catch (_err) {
        res.status(401).json({ error: 'Unauthorized - Invalid token' });
    }
};

const adminOnly = (req, res, next) => {
    auth(req, res, () => {
        if (req.user?.role !== 'admin' && req.user?.role !== 'root') {
            return res.status(403).json({ error: 'Forbidden - Admin only' });
        }
        next();
    });
};

module.exports = { auth, adminOnly };
