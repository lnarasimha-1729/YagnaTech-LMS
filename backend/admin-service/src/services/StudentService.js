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
        const { rows, count } = await userRepo.paginateByRole('student', {
            search,
            limit,
            offset,
            order: [['id', 'DESC']],
        });
        const students = rows.map((r) => ({ ...sanitize(r), enrolled_count: 0 }));
        return { students, total: count, page: Number(page), per_page: limit };
    } catch (err) {
        console.warn('[students] DB query failed:', err.message);
        return { students: [], total: 0, page: Number(page), per_page: limit };
    }
};

const get = async (id) => {
    const student = await userRepo.findByIdAndRole(id, 'student');
    if (!student) throw new HttpError(404, 'Student not found');
    return { student: sanitize(student) };
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

    const data = {
        name: body.name,
        about: body.about || null,
        phone: body.phone || null,
        address: body.address || null,
        email: body.email,
        password: await bcrypt.hash(body.password, 10),
        facebook: body.facebook || null,
        twitter: body.twitter || null,
        website: body.website || null,
        linkedin: body.linkedin || null,
        role: 'student',
        status: 1,
    };

    if (file) {
        const ext = file.originalname.split('.').pop() || 'jpg';
        const destPath = `uploads/users/student/${niceFileName(body.name, ext)}`;
        await upload(file, destPath, 200, 200);
        data.photo = destPath;
    }

    const student = await userRepo.create(data);
    return { message: 'Student added successfully', student: sanitize(student) };
};

const update = async (id, body, file) => {
    const student = await userRepo.findByIdAndRole(id, 'student');
    if (!student) throw new HttpError(404, 'Student not found');

    if (!body.name || !body.email) throw new HttpError(422, 'Name and email are required');
    if (await userRepo.isEmailTaken(body.email, id)) {
        throw new HttpError(422, 'Email already in use');
    }

    const data = {
        name: body.name,
        about: body.about ?? student.about,
        phone: body.phone ?? student.phone,
        address: body.address ?? student.address,
        email: body.email,
        facebook: body.facebook ?? student.facebook,
        twitter: body.twitter ?? student.twitter,
        website: body.website ?? student.website,
        linkedin: body.linkedin ?? student.linkedin,
    };

    if (body.password) {
        if (String(body.password).length < 8) {
            throw new HttpError(422, 'Password must be at least 8 characters');
        }
        data.password = await bcrypt.hash(body.password, 10);
    }

    if (file) {
        if (student.photo) removeFile(student.photo);
        const ext = file.originalname.split('.').pop() || 'jpg';
        const destPath = `uploads/users/student/${niceFileName(body.name, ext)}`;
        await upload(file, destPath, 200, 200);
        data.photo = destPath;
    }

    await student.update(data);
    return { message: 'Student updated successfully', student: sanitize(student) };
};

const remove = async (id) => {
    const student = await userRepo.findByIdAndRole(id, 'student');
    if (!student) throw new HttpError(404, 'Student not found');
    if (student.photo) removeFile(student.photo);
    await student.destroy();
    return { message: 'Student removed successfully' };
};

module.exports = { list, get, create, update, remove };
