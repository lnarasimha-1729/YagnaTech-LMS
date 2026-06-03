const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { QueryTypes } = require('sequelize');
const env = require('../config/env');
const authDb = require('../config/authDatabase');
const userRepo = require('../repositories/UserRepository');
const { HttpError } = require('../middlewares/error');
const { upload: saveUpload, removeFile, niceFileName } = require('../helpers/fileUploader');

// Block login when the admin's college has been revoked from Manage Colleges
// → Options → Revoke Access. Raw SELECT into the shared auth DB (colleges
// lives there). Root admin has no college_id so this is a no-op for them.
// Best-effort on DB hiccups — column missing or query failure falls through.
async function assertCollegeActive(collegeId) {
    if (!collegeId) return;
    try {
        const rows = await authDb.query(
            'SELECT isActive FROM colleges WHERE clgId = :clgId LIMIT 1',
            { replacements: { clgId: collegeId }, type: QueryTypes.SELECT }
        );
        if (rows.length && Number(rows[0].isActive) === 0) {
            throw new HttpError(403, 'Your college access has been revoked. Please contact your administrator.');
        }
    } catch (e) {
        if (e instanceof HttpError) throw e;
        console.warn('[admin-auth] college isActive check skipped:', e.message);
    }
}

const sanitize = (u) => {
    const o = u.toJSON ? u.toJSON() : { ...u };
    delete o.password;
    delete o.remember_token;
    return o;
};

// Root admin is now identified by the stored role: role === 'root'. This
// replaces the old lowest-id / email-pinned lookup (and its module-load cache,
// which needed a service restart whenever the root row changed). The role
// travels in the JWT, so no DB lookup is needed to know who is root.
const isRoot = (user) => user?.role === 'root';

const signToken = (user) =>
    jwt.sign(
        // role distinguishes 'root' (global super admin) from 'admin' (college
        // admin); college_id scopes college-admin endpoints without a second DB
        // lookup. is_root_admin is kept as a derived convenience flag for older
        // clients, but role==='root' is the source of truth.
        {
            id: user.id,
            email: user.email,
            role: user.role,
            name: user.name,
            college_id: user.college_id || null,
            is_root_admin: isRoot(user),
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

    const isRootAdmin = isRoot(user);
    // Root admin keeps access regardless of college state — they need to be
    // able to log in and toggle access back on. Everyone else (college-admin
    // role) gets the gate.
    if (!isRootAdmin) {
        await assertCollegeActive(user.college_id);
    }
    return {
        token: signToken(user),
        user: { ...sanitize(user), is_root_admin: isRootAdmin },
    };
};

const me = async (userId) => {
    const user = await userRepo.findById(userId);
    if (!user) throw new HttpError(404, 'User not found');
    return { ...sanitize(user), is_root_admin: isRoot(user) };
};

// Change the signed-in user's password. Verifies the current password against
// the stored bcrypt hash before writing the new one.
//
// Two account stores back the admin shell:
//   - Root & college admins live in lms_admin.users (this service's User model;
//     column `password`, integer `id`).
//   - Instructors live in lucy_devdb.users (the auth-service DB; column
//     `passwordHash`, string `userId`). Their JWT carries id = userId.
// So we try the admin table first, then fall back to the auth DB by userId.
//
// 422 (not 401) on a wrong current password: it's a form-validation error, not
// a dead session. The admin API client treats any 401 as an expired token and
// force-logs-out → /login, which would kick the user out on a simple typo.
const changePassword = async (userId, { currentPassword, newPassword, confirmPassword }) => {
    if (!currentPassword || !newPassword) {
        throw new HttpError(422, 'Current and new password are required');
    }
    if (String(newPassword).length < 6) {
        throw new HttpError(422, 'New password must be at least 6 characters');
    }
    if (confirmPassword !== undefined && newPassword !== confirmPassword) {
        throw new HttpError(422, 'New password and confirmation do not match');
    }

    // Admin path: lms_admin.users by integer id.
    const user = await userRepo.findById(userId);
    if (user) {
        const ok = user.password ? await bcrypt.compare(currentPassword, user.password) : false;
        if (!ok) throw new HttpError(422, 'Current password is incorrect');
        if (await bcrypt.compare(newPassword, user.password)) {
            throw new HttpError(422, 'New password must be different from the current password');
        }
        await user.update({ password: await bcrypt.hash(String(newPassword), 10) });
        return { message: 'Password updated successfully' };
    }

    // Instructor path: lucy_devdb.users by string userId, passwordHash column.
    return changeInstructorPassword(userId, currentPassword, newPassword);
};

// Instructor password change against the auth-service DB. Mirrors auth-service's
// own changePassword but runs in-process so the instructor uses the same admin
// endpoint (and the same 422 contract) the rest of the admin shell does.
const changeInstructorPassword = async (userId, currentPassword, newPassword) => {
    const rows = await authDb.query(
        'SELECT userId, passwordHash FROM users WHERE userId = :uid LIMIT 1',
        { replacements: { uid: String(userId) }, type: QueryTypes.SELECT }
    );
    const row = rows[0];
    if (!row) throw new HttpError(404, 'User not found');

    const ok = row.passwordHash ? await bcrypt.compare(currentPassword, row.passwordHash) : false;
    if (!ok) throw new HttpError(422, 'Current password is incorrect');
    if (await bcrypt.compare(newPassword, row.passwordHash)) {
        throw new HttpError(422, 'New password must be different from the current password');
    }

    const hash = await bcrypt.hash(String(newPassword), 10);
    await authDb.query(
        'UPDATE users SET passwordHash = :hash, updatedAt = NOW() WHERE userId = :uid',
        { replacements: { hash, uid: String(userId) }, type: QueryTypes.UPDATE }
    );
    return { message: 'Password updated successfully' };
};

// ---------------------------------------------------------------------------
// Profile update — same two-store split as changePassword:
//   - Admins  → lms_admin.users (User model: name/email/phone/website/skills/
//               facebook/twitter/linkedin/about/biography/photo).
//   - Instructors → lucy_devdb.users (name/email/phone/expertise/bio/
//               linkedinUrl/facebookUrl/twitterUrl/instructorPhoto).
// Photo (optional) is an uploaded file moved out of tmp into uploads/.
// ---------------------------------------------------------------------------

const trimOrNull = (v) => {
    if (v === undefined) return undefined; // caller omitted → leave unchanged
    const s = String(v).trim();
    return s === '' ? null : s;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const updateProfile = async (userId, body = {}, file = null) => {
    const admin = await userRepo.findById(userId);
    if (admin) return updateAdminProfile(admin, body, file);
    return updateInstructorProfile(userId, body, file);
};

const updateAdminProfile = async (user, body, file) => {
    const patch = {};
    // Simple text columns — only set the ones the caller actually sent.
    for (const [field, col] of Object.entries({
        name: 'name', phone: 'phone', facebook: 'facebook', twitter: 'twitter',
        linkedin: 'linkedin', about: 'about', biography: 'biography', skills: 'skills',
    })) {
        if (body[field] !== undefined) patch[col] = trimOrNull(body[field]);
    }
    // The Manage Profile form's "Area of Expertise" field is sent as
    // `expertise`. The admin schema has no expertise column — it maps to
    // `about` (what the course-details page reads as creator.about). Only
    // applied when the caller didn't already send an explicit `about`.
    if (body.expertise !== undefined && body.about === undefined) {
        patch.about = trimOrNull(body.expertise);
    }
    if (patch.name === null) throw new HttpError(422, 'Name is required');

    if (body.email !== undefined) {
        const email = trimOrNull(body.email);
        if (!email || !EMAIL_RE.test(email)) throw new HttpError(422, 'A valid email is required');
        if (email !== user.email && await userRepo.isEmailTaken(email, user.id)) {
            throw new HttpError(422, 'Email already in use');
        }
        patch.email = email;
    }

    if (file) {
        const ext = (file.originalname || '').split('.').pop() || 'jpg';
        const dest = `${env.uploadDir}/users/admin/${niceFileName(body.name || user.name || 'user', ext)}`;
        const saved = await saveUpload(file, dest, 400, 400);
        if (saved) {
            if (user.photo) removeFile(user.photo);
            patch.photo = saved;
        }
    }

    await user.update(patch);
    return { message: 'Profile updated successfully', photo: patch.photo ?? user.photo ?? null };
};

const updateInstructorProfile = async (userId, body, file) => {
    const rows = await authDb.query(
        'SELECT userId, name, email, instructorPhoto FROM users WHERE userId = :uid LIMIT 1',
        { replacements: { uid: String(userId) }, type: QueryTypes.SELECT }
    );
    const row = rows[0];
    if (!row) throw new HttpError(404, 'User not found');

    const sets = [];
    const repl = { uid: String(userId) };
    const add = (col, val) => { sets.push(`${col} = :${col}`); repl[col] = val; };

    // Map the form to the instructor schema. Twitter/facebook/skills/biography
    // have no column there, so they're silently ignored.
    if (body.name !== undefined) {
        const name = trimOrNull(body.name);
        if (!name) throw new HttpError(422, 'Name is required');
        add('name', name);
    }
    if (body.email !== undefined) {
        const email = trimOrNull(body.email);
        if (!email || !EMAIL_RE.test(email)) throw new HttpError(422, 'A valid email is required');
        if (email !== row.email) {
            const taken = await authDb.query(
                'SELECT 1 FROM users WHERE email = :email AND userId <> :uid LIMIT 1',
                { replacements: { email, uid: String(userId) }, type: QueryTypes.SELECT }
            );
            if (taken.length) throw new HttpError(422, 'Email already in use');
        }
        add('email', email);
    }
    if (body.phone !== undefined) add('phone', trimOrNull(body.phone));
    if (body.linkedin !== undefined) add('linkedinUrl', trimOrNull(body.linkedin));
    if (body.facebook !== undefined) add('facebookUrl', trimOrNull(body.facebook));
    if (body.twitter !== undefined) add('twitterUrl', trimOrNull(body.twitter));
    // Map the profile fields onto the same columns the admin's Add/Edit
    // Instructor form writes and the course-details page reads back
    // (PublicCourseService.fetchAuthUser), so edits from EITHER place show the
    // same on the course page:
    //   - "Area of Expertise" → expertise  (read as creator.about / .skills)
    //   - "Biography"         → bio         (read as creator.biography)
    // `about` is accepted as a fallback for the old "short title" field name.
    if (body.expertise !== undefined) add('expertise', trimOrNull(body.expertise));
    else if (body.about !== undefined) add('expertise', trimOrNull(body.about));
    if (body.biography !== undefined) add('bio', trimOrNull(body.biography));

    let photoPath;
    if (file) {
        const ext = (file.originalname || '').split('.').pop() || 'jpg';
        const dest = `${env.uploadDir}/users/instructor/${niceFileName(body.name || row.name || 'instructor', ext)}`;
        const saved = await saveUpload(file, dest, 400, 400);
        if (saved) {
            if (row.instructorPhoto) removeFile(row.instructorPhoto);
            add('instructorPhoto', saved);
            photoPath = saved;
        }
    }

    if (!sets.length) return { message: 'Nothing to update', photo: row.instructorPhoto || null };

    await authDb.query(
        `UPDATE users SET ${sets.join(', ')}, updatedAt = NOW() WHERE userId = :uid`,
        { replacements: repl, type: QueryTypes.UPDATE }
    );
    return { message: 'Profile updated successfully', photo: photoPath ?? row.instructorPhoto ?? null };
};

module.exports = { login, me, changePassword, updateProfile };
