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

// Root-admin-only gate. Both the root admin and college admins carry
// role === 'admin' (by design — see AuthService.signToken), so role alone
// CANNOT tell them apart. The distinguishing fact is `is_root_admin`, computed
// at login (user.id === lowest admin id) and baked into the JWT. Use this on
// global/management endpoints that a single college's admin must NOT reach:
// e.g. creating/deleting colleges, revoking college access, managing other
// admins. A college admin hitting these gets 403.
const rootOnly = (req, res, next) => {
    auth(req, res, () => {
        if (!req.user?.is_root_admin) {
            return res.status(403).json({ error: 'Forbidden - Root admin only' });
        }
        next();
    });
};

// College-admin-only gate (any admin that is NOT the root admin and is scoped
// to a college). Use on endpoints that only make sense for a college admin.
// The service layer must still scope results by req.user.college_id.
const collegeAdmin = (req, res, next) => {
    auth(req, res, () => {
        const isAdmin = req.user?.role === 'admin' || req.user?.role === 'root';
        if (!isAdmin || req.user?.is_root_admin || !req.user?.college_id) {
            return res.status(403).json({ error: 'Forbidden - College admin only' });
        }
        next();
    });
};

// Allows admin/root OR instructor. Used on course read/write surfaces that
// instructors may legitimately reach (course list, course edit, curriculum,
// zoom-live-class). The service layer further scopes results to courses they
// own / are assigned to (see CourseService.list scoping by req.user).
const adminOrInstructor = (req, res, next) => {
    auth(req, res, () => {
        const role = req.user?.role;
        if (role !== 'admin' && role !== 'root' && role !== 'instructor') {
            return res.status(403).json({ error: 'Forbidden' });
        }
        next();
    });
};

module.exports = { auth, adminOnly, rootOnly, collegeAdmin, adminOrInstructor };
