const bcrypt = require('bcryptjs');
const userRepo = require('../repositories/UserRepository');
const { upload, removeFile, niceFileName } = require('../helpers/fileUploader');
const { HttpError } = require('../middlewares/error');

const sanitize = (u) => {
    const o = u.toJSON ? u.toJSON() : { ...u };
    delete o.password;
    delete o.remember_token;
    return o;
};

const list = async ({ page = 1, per_page = 10, search = '' }) => {
    const limit = Number(per_page);
    const offset = (Number(page) - 1) * limit;

    try {
        const { rows, count } = await userRepo.paginateByRole('admin', {
            search,
            limit,
            offset,
            order: [['id', 'ASC']],
        });
        const rootId = await userRepo.findRootAdminId();
        const admins = await Promise.all(
            rows.map(async (r) => {
                const course_count = await userRepo.courseCountFor(r.id);
                return { ...sanitize(r), course_count, is_root_admin: r.id === rootId };
            })
        );
        return { admins, total: count, page: Number(page), per_page: limit, root_admin_id: rootId };
    } catch (err) {
        console.warn('[admins] DB query failed:', err.message);
        return { admins: [], total: 0, page: Number(page), per_page: limit, root_admin_id: null };
    }
};

const get = async (id) => {
    const admin = await userRepo.findByIdAndRole(id, 'admin');
    if (!admin) throw new HttpError(404, 'Admin not found');
    const rootId = await userRepo.findRootAdminId();
    return { admin: { ...sanitize(admin), is_root_admin: admin.id === rootId } };
};

const create = async (body, file) => {
    if (!body.name || !body.email || !body.password) {
        throw new HttpError(422, 'Name, email, and password are required');
    }
    if (String(body.password).length < 8) {
        throw new HttpError(422, 'Password must be at least 8 characters');
    }
    if (await userRepo.isEmailTaken(body.email)) {
        throw new HttpError(422, 'Email already in use');
    }

    // college_id (when set) flips the admin into "college admin" mode — they
    // can only see the College Dashboard tab and the JWT carries college_id so
    // /api/admin/college-dashboard/stats can scope to their college.
    const collegeId = body.college_id ? String(body.college_id).trim() : null;

    const data = {
        name: body.name,
        about: body.about || null,
        phone: body.phone || null,
        address: body.address || null,
        college_name: body.college_name ? String(body.college_name).trim() : null,
        college_id: collegeId || null,
        email: body.email,
        password: await bcrypt.hash(body.password, 10),
        facebook: body.facebook || null,
        twitter: body.twitter || null,
        website: body.website || null,
        linkedin: body.linkedin || null,
        paymentkeys: body.paymentkeys ? JSON.stringify(body.paymentkeys) : null,
        role: 'admin',
        status: 1,
    };

    if (file) {
        const ext = file.originalname.split('.').pop() || 'jpg';
        const destPath = `uploads/users/instructor/${niceFileName(body.name, ext)}`;
        await upload(file, destPath, 200, 200);
        data.photo = destPath;
    }

    const admin = await userRepo.create(data);
    return { message: 'Admin add successfully', admin: sanitize(admin) };
};

const update = async (id, body, file) => {
    const admin = await userRepo.findByIdAndRole(id, 'admin');
    if (!admin) throw new HttpError(404, 'Admin not found');

    if (!body.name || !body.email) throw new HttpError(422, 'Name and email are required');
    if (await userRepo.isEmailTaken(body.email, id)) {
        throw new HttpError(422, 'Email already in use');
    }

    const data = {
        name: body.name,
        about: body.about ?? admin.about,
        phone: body.phone ?? admin.phone,
        address: body.address ?? admin.address,
        college_name: body.college_name ?? admin.college_name,
        // body.college_id === '' means "clear it"; undefined means "leave alone".
        college_id: body.college_id !== undefined
            ? (body.college_id ? String(body.college_id).trim() : null)
            : admin.college_id,
        email: body.email,
        facebook: body.facebook ?? admin.facebook,
        twitter: body.twitter ?? admin.twitter,
        website: body.website ?? admin.website,
        linkedin: body.linkedin ?? admin.linkedin,
        paymentkeys: body.paymentkeys ? JSON.stringify(body.paymentkeys) : admin.paymentkeys,
    };

    if (body.password) {
        if (String(body.password).length < 8) {
            throw new HttpError(422, 'Password must be at least 8 characters');
        }
        data.password = await bcrypt.hash(body.password, 10);
    }

    if (file) {
        if (admin.photo) removeFile(admin.photo);
        const ext = file.originalname.split('.').pop() || 'jpg';
        const destPath = `uploads/users/instructor/${niceFileName(body.name, ext)}`;
        await upload(file, destPath, 200, 200);
        data.photo = destPath;
    }

    await admin.update(data);
    return { message: 'Admin update successfully', admin: sanitize(admin) };
};

const remove = async (id) => {
    const numericId = Number(id);
    const rootId = await userRepo.findRootAdminId();
    if (numericId === rootId) throw new HttpError(403, 'Cannot delete root admin');

    const admin = await userRepo.findByIdAndRole(numericId, 'admin');
    if (!admin) throw new HttpError(404, 'Admin not found');

    if (admin.photo) removeFile(admin.photo);
    await admin.destroy();
    return { message: 'Admin delete successfully' };
};

module.exports = { list, get, create, update, remove };
