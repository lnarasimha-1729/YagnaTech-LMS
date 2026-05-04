const crypto = require('crypto');
const path = require('path');
const repo = require('../repositories/CertificateRepository');
const { Setting } = require('../models');
const { HttpError } = require('../middlewares/error');
const fileUploader = require('../helpers/fileUploader');
const env = require('../config/env');

/**
 * Certificate domain logic — ports the standalone certificate-module's
 * controller into the canonical admin-service style (controller/service/repo).
 *
 * Two surfaces share this service:
 *   1. Coupon-style table CRUD for /admin/certificates.
 *   2. Settings/builder/issue/render flow ported from
 *      certificate-module/backend/src/controllers/CertificateController.js.
 *
 * Settings live in the existing `settings` table under types
 * `certificate_template` and `certificate_builder_content` (mirrors Laravel).
 */

const SETTING_TYPES = {
    template: 'certificate_template',
    builder: 'certificate_builder_content',
};

const APP_URL = env.appUrl || 'http://localhost:4000';

// Fallback template used when no builder content has been saved yet — keeps the
// download page from rendering blank for first-time installs. Same `.draggable`
// envelope shape the admin builder produces.
const DEFAULT_BUILDER_CONTENT = `<div class="certificate-layout-module" style="position:relative;width:900px;height:600px;background:#fff;font-family:'Roboto',sans-serif;">
    <img class="certificate-template" src="" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;pointer-events:none;" />
    <div class="draggable" style="position:absolute;left:60px;top:60px;font-size:14px;color:#1fb6a6">{qr_code}</div>
    <div class="draggable" style="position:absolute;left:200px;top:90px;font-size:28px;color:#5b6172;text-align:center;letter-spacing:6px;font-weight:600;text-transform:uppercase">COURSE COMPLETION CERTIFICATE</div>
    <div class="draggable" style="position:absolute;left:120px;top:170px;font-size:18px;font-family:'Italianno', cursive;color:#9aa1ad;text-align:center;font-style:italic">This certificate is awarded to {student_name} in recognition of their successful completion of {course_title} on {course_completion_date}.</div>
    <div class="draggable" style="position:absolute;left:280px;top:290px;font-size:28px;font-family:'Italianno', cursive;color:#1fb6a6;text-align:center;font-style:italic;font-weight:600">{course_title}</div>
    <div class="draggable" style="position:absolute;left:90px;top:470px;font-size:16px;font-family:'Italianno', cursive;color:#1fb6a6;text-align:center;font-style:italic">{instructor_name}</div>
    <div class="draggable" style="position:absolute;left:350px;top:470px;font-size:16px;font-family:'Italianno', cursive;color:#1fb6a6;text-align:center;font-style:italic">{course_completion_date}</div>
    <div class="draggable" style="position:absolute;left:610px;top:470px;font-size:16px;font-family:'Italianno', cursive;color:#1fb6a6;text-align:center;font-style:italic">{student_name}</div>
    <div class="draggable" style="position:absolute;left:350px;top:540px;font-size:12px;font-family:'Italianno', cursive;color:#9aa1ad;text-align:center;font-style:italic">{certificate_download_date}</div>
</div>`;

// ---- helpers ----

// Mirrors helpers/random.php — 12-char alphanumeric.
const generateIdentifier = (len = 12) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const bytes = crypto.randomBytes(len);
    let out = '';
    for (let i = 0; i < len; i++) out += chars[bytes[i] % chars.length];
    return out;
};

const getSetting = async (type) => {
    const row = await Setting.findOne({ where: { type } });
    return row ? row.description : '';
};

const setSetting = async (type, description) => {
    const row = await Setting.findOne({ where: { type } });
    if (row) await row.update({ description });
    else await Setting.create({ type, description });
};

const dateFormatter = (d) => {
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return '';
    return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const normaliseStatus = (value) => {
    if (value === undefined || value === null || value === '') return 1;
    return Number(value) === 0 ? 0 : 1;
};

// ---- table CRUD ----

const list = async ({ page = 1, search } = {}) => {
    const limit = 10;
    const offset = (Number(page) - 1) * limit;
    try {
        const { count, rows } = await repo.paginate({ search, limit, offset });
        return {
            certificates: {
                data: rows,
                total: count,
                per_page: limit,
                current_page: Number(page),
                last_page: Math.max(1, Math.ceil(count / limit)),
            },
        };
    } catch (err) {
        console.warn('[certificates] list query failed:', err.message);
        return {
            certificates: { data: [], total: 0, per_page: limit, current_page: Number(page), last_page: 1 },
        };
    }
};

const get = async ({ id }) => {
    const certificate = await repo.findByIdWithJoins(id);
    if (!certificate) throw new HttpError(404, 'Certificate not found');
    return { certificate };
};

const create = async ({ body, file }) => {
    if (!body.title || typeof body.title !== 'string') {
        throw new HttpError(422, 'Title is required');
    }

    let template_image = null;
    if (file) {
        const ext = path.extname(file.originalname).slice(1) || 'png';
        const dest = `${env.uploadDir}/certificate-template/${fileUploader.niceFileName(body.title, ext)}`;
        template_image = await fileUploader.upload(file, dest);
    }

    const row = await repo.create({
        title: body.title,
        description: body.description || null,
        status: normaliseStatus(body.status),
        identifier: generateIdentifier(),
        template_image,
    });
    return { success: 'Certificate has been created successfully.', certificate: row };
};

const update = async ({ id, body, file }) => {
    const existing = await repo.findById(id);
    if (!existing) throw new HttpError(404, 'Certificate not found');

    const data = {
        title: body.title || existing.title,
        description: body.description !== undefined ? body.description : existing.description,
        status: body.status !== undefined ? normaliseStatus(body.status) : existing.status,
    };

    if (file) {
        const ext = path.extname(file.originalname).slice(1) || 'png';
        const dest = `${env.uploadDir}/certificate-template/${fileUploader.niceFileName(data.title, ext)}`;
        if (existing.template_image) fileUploader.removeFile(existing.template_image);
        data.template_image = await fileUploader.upload(file, dest);
    }

    await existing.update(data);
    return { success: 'Certificate has been updated successfully.', certificate: existing };
};

const remove = async ({ id }) => {
    const existing = await repo.findById(id);
    if (!existing) throw new HttpError(404, 'Certificate not found');
    if (existing.template_image) fileUploader.removeFile(existing.template_image);
    await existing.destroy();
    return { success: 'Certificate has been deleted successfully.' };
};

const toggleStatus = async ({ id }) => {
    const existing = await repo.findById(id);
    if (!existing) throw new HttpError(404, 'Certificate not found');
    await existing.update({ status: existing.status ? 0 : 1 });
    return { success: 'Status has been updated', certificate: existing };
};

// ---- settings / builder ----

const getSettings = async () => {
    const [tpl, html] = await Promise.all([
        getSetting(SETTING_TYPES.template),
        getSetting(SETTING_TYPES.builder),
    ]);
    return {
        certificate_template: tpl || '',
        certificate_builder_content: html || '',
    };
};

const uploadTemplate = async ({ file }) => {
    if (!file) throw new HttpError(422, 'certificate_template is required');

    const previous = await getSetting(SETTING_TYPES.template);
    const ext = path.extname(file.originalname).slice(1) || 'png';
    const dest = `${env.uploadDir}/certificate-template/${fileUploader.niceFileName('certificate-template', ext)}`;
    const newPath = await fileUploader.upload(file, dest);

    if (previous && previous !== newPath) fileUploader.removeFile(previous);
    await setSetting(SETTING_TYPES.template, newPath);

    // Mirror Laravel: replace the <img src> in saved builder HTML so existing
    // builder content immediately uses the new image.
    const currentHtml = await getSetting(SETTING_TYPES.builder);
    if (currentHtml) {
        const newSrc = `${APP_URL}/${newPath}`;
        const updated = currentHtml.replace(/(<img[^>]+src=")([^"]+)(")/g, `$1${newSrc}$3`);
        if (updated !== currentHtml) await setSetting(SETTING_TYPES.builder, updated);
    }

    return {
        success: 'Certificate template has been updated',
        certificate_template: newPath,
    };
};

const updateBuilder = async ({ certificate_builder_content }) => {
    if (!certificate_builder_content) {
        throw new HttpError(422, 'certificate_builder_content is required');
    }
    await setSetting(SETTING_TYPES.builder, certificate_builder_content);
    return { success: 'Certificate builder template has been updated' };
};

// ---- issue / render ----

// Returns the (single) certificate for a student/course pair, or null if the
// student hasn't completed the course yet. user_id is left as-is (string from
// auth-service) so it matches the row's stored value exactly.
const findForUserAndCourse = async ({ user_id, course_id }) => {
    if (!user_id || !course_id) return null;
    return repo.findByPair(user_id, Number(course_id));
};

// Returns every certificate the student has earned, with the joined course so
// the frontend "My Certificates" page can show the program title + completion date.
const listForUser = async ({ user_id }) => {
    if (!user_id) return { certificates: [] };
    const rows = await repo.findAllForUser(user_id);
    return { certificates: rows.map((r) => (r.toJSON ? r.toJSON() : r)) };
};

const issue = async ({ user_id, course_id, progress }) => {
    if (!user_id || !course_id) {
        throw new HttpError(422, 'user_id and course_id are required');
    }
    const pct = Number(progress);
    if (!Number.isFinite(pct) || pct < 100) {
        throw new HttpError(400, 'Course progress must be 100% before a certificate can be issued.');
    }

    const existing = await repo.findByPair(user_id, Number(course_id));
    if (existing) {
        return { certificate: existing, created: false };
    }
    const row = await repo.create({
        user_id: String(user_id), // keep auth-service's string id verbatim
        course_id: Number(course_id),
        identifier: generateIdentifier(12),
        issued_at: new Date(),
    });
    return { certificate: row, created: true };
};

const renderByIdentifier = async ({ identifier }) => {
    let QRCode;
    try {
        QRCode = require('qrcode');
    } catch {
        throw new HttpError(500, 'qrcode package not installed. Run: npm install qrcode');
    }

    const row = await repo.findByIdentifier(identifier);
    if (!row) throw new HttpError(404, 'Certificate not found at this url');

    const cert = row.toJSON ? row.toJSON() : row;
    const user = cert.user || null;
    const course = cert.course || null;

    const builderRaw = await getSetting(SETTING_TYPES.builder);
    const templatePath = await getSetting(SETTING_TYPES.template);

    const verifyUrl = `${APP_URL}/api/public/certificate/${identifier}`;
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, { width: 300, margin: 1 });
    const qrCodeHtml = `<img src="${qrDataUrl}" alt="qr" style="width:120px;height:120px;" />`;

    const studentName = user?.name || `User #${cert.user_id}`;
    const courseTitle = course?.title || `Course #${cert.course_id}`;
    const instructorHtml = user?.name ? `<p>${user.name}</p>` : '';
    const courseDuration = course?.total_duration || '—';
    const lessonCount = course?.lesson_count ?? 0;
    const courseLevel = course?.level ? course.level[0].toUpperCase() + course.level.slice(1) : '';
    const courseLanguage = course?.language ? course.language[0].toUpperCase() + course.language.slice(1) : '';
    const completionDate = dateFormatter(cert.issued_at || cert.created_at);
    const downloadDate = dateFormatter(new Date());

    // Fall back to the bundled default if no builder content has been saved.
    let html = builderRaw && builderRaw.trim() ? builderRaw : DEFAULT_BUILDER_CONTENT;
    html = html
        .replace(/\{course_duration\}/g, courseDuration)
        .replace(/\{instructor_name\}/g, instructorHtml)
        .replace(/\{student_name\}/g, studentName)
        .replace(/\{course_title\}/g, courseTitle)
        .replace(/\{number_of_lesson\}/g, String(lessonCount))
        .replace(/\{qr_code\}/g, qrCodeHtml)
        .replace(/\{course_completion_date\}/g, completionDate)
        .replace(/\{certificate_download_date\}/g, downloadDate)
        .replace(/\{course_level\}/g, courseLevel)
        .replace(/\{course_language\}/g, courseLanguage);

    if (templatePath) {
        const fullSrc = `${APP_URL}/${templatePath}`;
        html = html.replace(
            /(<img[^>]*class=["']certificate-template["'][^>]*src=["'])([^"']*)(["'])/gi,
            `$1${fullSrc}$3`
        );
    }

    delete cert.user; delete cert.course;
    return {
        certificate: cert,
        html,
        student_name: studentName,
        course_title: courseTitle,
        verify_url: verifyUrl,
        qr_code: qrDataUrl,
    };
};

module.exports = {
    list, get, create, update, remove, toggleStatus,
    getSettings, uploadTemplate, updateBuilder,
    issue, renderByIdentifier, findForUserAndCourse, listForUser,
};
