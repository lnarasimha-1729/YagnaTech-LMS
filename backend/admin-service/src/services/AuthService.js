const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const userRepo = require('../repositories/UserRepository');
const { HttpError } = require('../middlewares/error');

const sanitize = (u) => {
    const o = u.toJSON ? u.toJSON() : { ...u };
    delete o.password;
    delete o.remember_token;
    return o;
};

// Root admin = the lowest-id admin row. Cached at module load so signToken
// stays sync (the JWT signing path runs on every login & doesn't need to
// re-query the DB). If the root row is ever deleted/re-seeded the service
// must be restarted — same constraint that already exists in AdminService.
let cachedRootId = null;
const getRootId = async () => {
    if (cachedRootId !== null) return cachedRootId;
    cachedRootId = await userRepo.findRootAdminId();
    return cachedRootId;
};

const signToken = (user, isRootAdmin) =>
    jwt.sign(
        // college_id is included so college-admin endpoints can scope by it
        // without a second DB lookup per request. is_root_admin is included
        // so the frontend can route root admins to the regular dashboard and
        // every other admin to the college dashboard without an extra fetch.
        {
            id: user.id,
            email: user.email,
            role: user.role,
            name: user.name,
            college_id: user.college_id || null,
            is_root_admin: !!isRootAdmin,
        },
        env.jwt.secret,
        { expiresIn: env.jwt.expiresIn }
    );

const login = async ({ email, password }) => {
    if (!email || !password) throw new HttpError(422, 'Email and password are required');

    const user = await userRepo.findByEmail(email);
    if (!user) throw new HttpError(401, 'Invalid credentials');
    if (user.role !== 'admin' && user.role !== 'root') {
        throw new HttpError(403, 'Forbidden - Admin only');
    }
    if (user.status !== undefined && user.status !== null && Number(user.status) === 0) {
        throw new HttpError(403, 'Account is disabled');
    }

    const ok = user.password ? await bcrypt.compare(password, user.password) : false;
    if (!ok) throw new HttpError(401, 'Invalid credentials');

    const rootId = await getRootId();
    const isRootAdmin = user.id === rootId;
    return {
        token: signToken(user, isRootAdmin),
        user: { ...sanitize(user), is_root_admin: isRootAdmin },
    };
};

const me = async (userId) => {
    const user = await userRepo.findById(userId);
    if (!user) throw new HttpError(404, 'User not found');
    const rootId = await getRootId();
    return { ...sanitize(user), is_root_admin: user.id === rootId };
};

module.exports = { login, me };
