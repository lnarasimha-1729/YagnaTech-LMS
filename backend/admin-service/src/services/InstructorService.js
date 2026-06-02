// Instructor admin CRUD. Instructors are auth-service users with role
// 'instructor' (lucy_devdb.users + roles), so we operate via the read/write
// authDb handle and join the roles table — the same pattern StudentService
// uses for students. Schema lives on the user row (expertise, bio,
// yearsOfExperience, linkedinUrl added alongside the existing user columns).
const bcrypt = require('bcryptjs');
const { QueryTypes } = require('sequelize');
const authDb = require('../config/authDatabase');
const { HttpError } = require('../middlewares/error');
const { upload, removeFile, niceFileName } = require('../helpers/fileUploader');

const ROLE = 'instructor';

// Persist the uploaded image to uploads/users/instructor/<slug-name>-<ts>.<ext>
// and return the relative path (same shape AdminService/StudentService use).
// No-op when no file was sent.
const saveInstructorPhoto = async (file, displayName) => {
    if (!file) return null;
    const ext = (file.originalname || '').split('.').pop() || 'jpg';
    const destPath = `uploads/users/instructor/${niceFileName(displayName || 'instructor', ext)}`;
    await upload(file, destPath, 400, 400);
    return destPath;
};

// 11-char userId, same pattern as auth-service's generateUserID ("20" + 9
// digits). Inlined so admin-service doesn't depend on the auth service code.
const generateUserId = () => {
    const n = Math.floor(100000000 + Math.random() * 900000000);
    return `20${n}`;
};

const resolveInstructorRoleId = async () => {
    const rows = await authDb.query(
        "SELECT roleId FROM roles WHERE role = :role LIMIT 1",
        { replacements: { role: ROLE }, type: QueryTypes.SELECT }
    );
    if (!rows.length) throw new HttpError(500, "instructor role not found in roles table");
    return rows[0].roleId;
};

const list = async ({ page = 1, per_page = 1000, search = '' }) => {
    const limit = Number(per_page);
    const offset = (Number(page) - 1) * limit;
    const like = `%${String(search).trim()}%`;
    const searchClause = search ? 'AND (u.name LIKE :like OR u.email LIKE :like OR u.expertise LIKE :like)' : '';
    try {
        const [{ count }] = await authDb.query(
            `SELECT COUNT(*) AS count
               FROM users u
               JOIN roles r ON r.roleId = u.roleId
              WHERE r.role = :role ${searchClause}`,
            { replacements: { role: ROLE, like }, type: QueryTypes.SELECT }
        );
        const rows = await authDb.query(
            `SELECT u.userId AS id, u.name, u.email, u.phone, u.expertise,
                    u.yearsOfExperience, u.linkedinUrl, u.bio, u.address,
                    u.instructorPhoto, u.createdAt
               FROM users u
               JOIN roles r ON r.roleId = u.roleId
              WHERE r.role = :role ${searchClause}
              ORDER BY u.createdAt DESC
              LIMIT :limit OFFSET :offset`,
            { replacements: { role: ROLE, like, limit, offset }, type: QueryTypes.SELECT }
        );
        // `photo` is the relative upload path (e.g. uploads/users/instructor/foo.jpg);
        // admin UI prepends VITE_ADMIN_API_URL the same way it does for students.
        const instructors = rows.map((r) => {
            const { instructorPhoto, ...rest } = r;
            return { ...rest, photo: instructorPhoto || null, course_count: 0 };
        });
        return { instructors, total: Number(count), page: Number(page), per_page: limit };
    } catch (err) {
        console.warn('[instructors] auth DB query failed:', err.message);
        return { instructors: [], total: 0, page: Number(page), per_page: limit };
    }
};

const get = async (id) => {
    const rows = await authDb.query(
        `SELECT u.userId AS id, u.name, u.email, u.phone, u.dob, u.gender,
                u.expertise, u.bio, u.yearsOfExperience, u.linkedinUrl,
                u.facebookUrl, u.twitterUrl,
                u.address, u.instructorPhoto, u.createdAt
           FROM users u
           JOIN roles r ON r.roleId = u.roleId
          WHERE r.role = :role AND u.userId = :id LIMIT 1`,
        { replacements: { role: ROLE, id: String(id) }, type: QueryTypes.SELECT }
    );
    if (!rows.length) throw new HttpError(404, 'Instructor not found');
    const { instructorPhoto, ...rest } = rows[0];
    return { instructor: { ...rest, photo: instructorPhoto || null } };
};

const findById = async (id) => {
    // Include instructorPhoto so update() can delete the previous file when
    // the admin uploads a replacement, and remove() can clean it up on delete.
    const rows = await authDb.query(
        "SELECT userId, instructorPhoto FROM users WHERE userId = :id LIMIT 1",
        { replacements: { id: String(id) }, type: QueryTypes.SELECT }
    );
    return rows[0] || null;
};

const isEmailTaken = async (email, excludeId = null) => {
    const sql = excludeId
        ? "SELECT 1 FROM users WHERE email = :email AND userId <> :id LIMIT 1"
        : "SELECT 1 FROM users WHERE email = :email LIMIT 1";
    const rows = await authDb.query(sql, {
        replacements: { email, id: String(excludeId || '') },
        type: QueryTypes.SELECT,
    });
    return rows.length > 0;
};

const create = async (body, file = null) => {
    if (!body.name || !body.email || !body.password) {
        throw new HttpError(422, 'Name, email, and password are required');
    }
    if (String(body.password).length < 8) {
        throw new HttpError(422, 'Password must be at least 8 characters');
    }
    if (await isEmailTaken(body.email)) {
        throw new HttpError(422, 'Email already in use');
    }
    const roleId = await resolveInstructorRoleId();
    const userId = generateUserId();
    const passwordHash = await bcrypt.hash(body.password, 10);
    // Upload happens before INSERT so a failed upload doesn't leave a
    // half-created instructor row behind.
    const photoPath = await saveInstructorPhoto(file, body.name);

    await authDb.query(
        `INSERT INTO users
            (userId, name, email, passwordHash, phone, roleId,
             expertise, bio, yearsOfExperience, linkedinUrl, facebookUrl,
             twitterUrl, address, instructorPhoto, createdAt, updatedAt)
         VALUES
            (:userId, :name, :email, :passwordHash, :phone, :roleId,
             :expertise, :bio, :yearsOfExperience, :linkedinUrl, :facebookUrl,
             :twitterUrl, :address, :instructorPhoto, NOW(), NOW())`,
        {
            replacements: {
                userId,
                name: body.name,
                email: body.email,
                passwordHash,
                phone: body.phone || null,
                roleId,
                expertise: body.expertise || null,
                bio: body.bio || null,
                yearsOfExperience: body.yearsOfExperience != null && body.yearsOfExperience !== ''
                    ? Number(body.yearsOfExperience) : null,
                linkedinUrl: body.linkedinUrl || null,
                facebookUrl: body.facebookUrl || null,
                twitterUrl: body.twitterUrl || null,
                address: body.address || null,
                instructorPhoto: photoPath,
            },
            type: QueryTypes.INSERT,
        }
    );
    return { message: 'Instructor added successfully', instructor: (await get(userId)).instructor };
};

const update = async (id, body, file = null) => {
    const existing = await findById(id);
    if (!existing) throw new HttpError(404, 'Instructor not found');
    if (!body.name || !body.email) throw new HttpError(422, 'Name and email are required');
    if (await isEmailTaken(body.email, id)) {
        throw new HttpError(422, 'Email already in use');
    }
    const sets = [
        'name = :name', 'email = :email', 'phone = :phone',
        'expertise = :expertise', 'bio = :bio',
        'yearsOfExperience = :yearsOfExperience', 'linkedinUrl = :linkedinUrl',
        'facebookUrl = :facebookUrl', 'twitterUrl = :twitterUrl',
        'address = :address',
    ];
    const replacements = {
        id: String(id),
        name: body.name,
        email: body.email,
        phone: body.phone ?? null,
        expertise: body.expertise ?? null,
        bio: body.bio ?? null,
        yearsOfExperience: body.yearsOfExperience != null && body.yearsOfExperience !== ''
            ? Number(body.yearsOfExperience) : null,
        linkedinUrl: body.linkedinUrl ?? null,
        facebookUrl: body.facebookUrl ?? null,
        twitterUrl: body.twitterUrl ?? null,
        address: body.address ?? null,
    };
    if (body.password) {
        if (String(body.password).length < 8) {
            throw new HttpError(422, 'Password must be at least 8 characters');
        }
        sets.push('passwordHash = :passwordHash');
        replacements.passwordHash = await bcrypt.hash(body.password, 10);
    }
    // Only touch instructorPhoto when a new file was actually uploaded —
    // omitting a file in the edit form must keep the existing image.
    if (file) {
        const newPath = await saveInstructorPhoto(file, body.name);
        sets.push('instructorPhoto = :instructorPhoto');
        replacements.instructorPhoto = newPath;
    }
    await authDb.query(
        `UPDATE users SET ${sets.join(', ')} WHERE userId = :id`,
        { replacements, type: QueryTypes.UPDATE }
    );
    // Best-effort old-file cleanup after the UPDATE succeeded; if the path
    // changed, drop the previous file from disk so we don't accumulate
    // orphaned uploads.
    if (file && existing.instructorPhoto && existing.instructorPhoto !== replacements.instructorPhoto) {
        try { removeFile(existing.instructorPhoto); } catch { /* ignore */ }
    }
    return { message: 'Instructor updated successfully', instructor: (await get(id)).instructor };
};

const remove = async (id) => {
    const existing = await findById(id);
    if (!existing) throw new HttpError(404, 'Instructor not found');
    await authDb.query(
        'DELETE FROM users WHERE userId = :id',
        { replacements: { id: String(id) }, type: QueryTypes.DELETE }
    );
    // Drop the avatar file too so deleting an instructor doesn't leave
    // orphaned images in uploads/users/instructor/.
    if (existing.instructorPhoto) {
        try { removeFile(existing.instructorPhoto); } catch { /* ignore */ }
    }
    return { message: 'Instructor removed successfully' };
};

module.exports = { list, get, create, update, remove };
