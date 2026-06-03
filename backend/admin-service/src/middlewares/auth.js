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

// Roles are now distinct and stored on the user row:
//   'root'  → the single super admin (global, no college). Superset of 'admin'.
//   'admin' → a college admin, scoped to one college (college_id set).
// `isAdminRole` is the "admin OR root" test used wherever both are allowed, so
// root is always a superset of admin. Use this instead of bare role==='admin'.
const isAdminRole = (role) => role === 'admin' || role === 'root';

const adminOnly = (req, res, next) => {
    auth(req, res, () => {
        if (!isAdminRole(req.user?.role)) {
            return res.status(403).json({ error: 'Forbidden - Admin only' });
        }
        next();
    });
};

// Root-admin-only gate. The distinction is now the stored role: only role==='root'
// passes. Use on global/management endpoints a single college's admin must NOT
// reach: creating/deleting colleges, revoking college access, managing other
// admins. A college admin (role==='admin') hitting these gets 403.
const rootOnly = (req, res, next) => {
    auth(req, res, () => {
        if (req.user?.role !== 'root') {
            return res.status(403).json({ error: 'Forbidden - Root admin only' });
        }
        next();
    });
};

// College-admin-only gate: role==='admin' (NOT root) and scoped to a college.
// The service layer must still scope results by req.user.college_id.
const collegeAdmin = (req, res, next) => {
    auth(req, res, () => {
        if (req.user?.role !== 'admin' || !req.user?.college_id) {
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
        if (!isAdminRole(role) && role !== 'instructor') {
            return res.status(403).json({ error: 'Forbidden' });
        }
        next();
    });
};

module.exports = { auth, adminOnly, rootOnly, collegeAdmin, adminOrInstructor, isAdminRole };
