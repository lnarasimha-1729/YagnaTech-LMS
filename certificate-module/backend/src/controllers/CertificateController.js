const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const store = require('../helpers/mockStore');
const { Certificate, Setting, User, Course } = require('../models');
const { templateDir, relativeTemplatePath } = require('../middleware/upload');

const USE_MOCK = process.env.USE_MOCK === 'true';
const APP_URL = process.env.APP_URL || 'http://localhost:5070';

// ---------- helpers ----------

// Mirrors Laravel's helpers/random.php — 12-character alphanumeric.
const randomIdentifier = (len = 12) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let out = '';
    for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
    return out;
};

const dbGetSetting = async (type) => {
    const row = await Setting.findOne({ where: { type } });
    return row ? row.description : '';
};

const dbSetSetting = async (type, description) => {
    const row = await Setting.findOne({ where: { type } });
    if (row) await row.update({ description });
    else await Setting.create({ type, description });
};

const removeFile = (relPath) => {
    if (!relPath) return;
    const filename = path.basename(relPath);
    const abs = path.join(templateDir, filename);
    if (fs.existsSync(abs)) {
        try { fs.unlinkSync(abs); } catch { /* swallow */ }
    }
};

const dateFormatter = (d) => {
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return '';
    return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

// ---------- settings ----------

// GET /admin/certificate/settings
exports.settings = async (_req, res) => {
    try {
        if (USE_MOCK) {
            return res.json({
                certificate_template: store.getSetting('certificate_template'),
                certificate_builder_content: store.getSetting('certificate_builder_content'),
            });
        }
        const [tpl, html] = await Promise.all([
            dbGetSetting('certificate_template'),
            dbGetSetting('certificate_builder_content'),
        ]);
        res.json({ certificate_template: tpl, certificate_builder_content: html });
    } catch (err) {
        console.warn('[certificate.settings]', err.message);
        res.json({
            certificate_template: store.getSetting('certificate_template'),
            certificate_builder_content: store.getSetting('certificate_builder_content'),
        });
    }
};

// POST /admin/certificate/template (multipart with `certificate_template`)
exports.updateTemplate = async (req, res) => {
    if (!req.file) return res.status(422).json({ error: 'certificate_template is required' });

    const newPath = relativeTemplatePath(req.file.filename);
    try {
        if (USE_MOCK) {
            removeFile(store.getSetting('certificate_template'));
            store.setSetting('certificate_template', newPath);
        } else {
            const previous = await dbGetSetting('certificate_template');
            removeFile(previous);
            await dbSetSetting('certificate_template', newPath);
        }

        // Mirror the Laravel controller: replace the src in the saved builder HTML
        // so existing builder content immediately uses the new image.
        const currentHtml = USE_MOCK
            ? store.getSetting('certificate_builder_content')
            : await dbGetSetting('certificate_builder_content');

        if (currentHtml) {
            const newSrc = `${APP_URL}/${newPath}`;
            const updated = currentHtml.replace(/(<img[^>]+src=")([^"]+)(")/g, `$1${newSrc}$3`);
            if (USE_MOCK) store.setSetting('certificate_builder_content', updated);
            else await dbSetSetting('certificate_builder_content', updated);
        }

        res.json({
            success: 'Certificate template has been updated',
            certificate_template: newPath,
        });
    } catch (err) {
        console.warn('[certificate.updateTemplate]', err.message);
        res.status(500).json({ error: err.message });
    }
};

// POST /admin/certificate/builder
exports.updateBuilder = async (req, res) => {
    const { certificate_builder_content } = req.body;
    if (!certificate_builder_content) return res.status(422).json({ error: 'certificate_builder_content is required' });

    try {
        if (USE_MOCK) store.setSetting('certificate_builder_content', certificate_builder_content);
        else await dbSetSetting('certificate_builder_content', certificate_builder_content);
        res.json({ success: 'Certificate builder template has been updated' });
    } catch (err) {
        console.warn('[certificate.updateBuilder]', err.message);
        res.status(500).json({ error: err.message });
    }
};

// ---------- certificates ----------

// POST /certificates/issue   { user_id, course_id, progress }
// Mirrors PlayerController@track_lesson_progress: creates a certificate row
// when progress >= 100 and no row exists yet for the (user, course) pair.
exports.issue = async (req, res) => {
    const { user_id, course_id, progress } = req.body;
    if (!user_id || !course_id) return res.status(422).json({ error: 'user_id and course_id are required' });
    const pct = Number(progress);
    if (!Number.isFinite(pct) || pct < 100) {
        return res.status(400).json({ error: 'Course progress must be 100% before a certificate can be issued.' });
    }

    try {
        if (USE_MOCK) {
            const existing = store.findCertByPair(user_id, course_id);
            if (existing) return res.json({ certificate: existing, created: false });
            const row = store.createCert({ user_id, course_id, identifier: randomIdentifier(12) });
            return res.json({ certificate: row, created: true });
        }
        const existing = await Certificate.findOne({ where: { user_id, course_id } });
        if (existing) return res.json({ certificate: existing.toJSON(), created: false });
        const row = await Certificate.create({ user_id, course_id, identifier: randomIdentifier(12) });
        res.json({ certificate: row.toJSON(), created: true });
    } catch (err) {
        console.warn('[certificate.issue]', err.message);
        res.status(500).json({ error: err.message });
    }
};

// GET /certificates  (admin list)
exports.list = async (_req, res) => {
    try {
        if (USE_MOCK) return res.json({ certificates: store.listCerts() });
        const rows = await Certificate.findAll({
            include: [{ model: User, as: 'user' }, { model: Course, as: 'course' }],
            order: [['id', 'DESC']],
        });
        res.json({ certificates: rows.map((r) => r.toJSON()) });
    } catch (err) {
        console.warn('[certificate.list]', err.message);
        res.json({ certificates: store.listCerts() });
    }
};

// DELETE /certificates/:id   (admin)
exports.destroy = async (req, res) => {
    const { id } = req.params;
    try {
        if (USE_MOCK) {
            const ok = store.removeCert(id);
            if (!ok) return res.status(404).json({ error: 'Certificate not found' });
            return res.json({ success: 'Certificate removed' });
        }
        const row = await Certificate.findByPk(id);
        if (!row) return res.status(404).json({ error: 'Certificate not found' });
        await row.destroy();
        res.json({ success: 'Certificate removed' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET /certificate/:identifier
// Mirrors HomeController@download_certificate: finds the cert, generates the
// QR code data-URI, runs the same {token} replacements over the saved HTML,
// and returns everything the frontend needs to render the printable view.
exports.render = async (req, res) => {
    const { identifier } = req.params;
    try {
        let cert, user, course;

        if (USE_MOCK) {
            cert = store.findCertByIdentifier(identifier);
            if (!cert) return res.status(404).json({ error: 'Certificate not found at this url' });
            user = store.findUser(cert.user_id);
            course = store.findCourse(cert.course_id);
        } else {
            const row = await Certificate.findOne({
                where: { identifier },
                include: [{ model: User, as: 'user' }, { model: Course, as: 'course' }],
            });
            if (!row) return res.status(404).json({ error: 'Certificate not found at this url' });
            cert = row.toJSON();
            user = cert.user || store.findUser(cert.user_id);
            course = cert.course || store.findCourse(cert.course_id);
        }

        const builderRaw = USE_MOCK
            ? store.getSetting('certificate_builder_content')
            : await dbGetSetting('certificate_builder_content');
        const templatePath = USE_MOCK
            ? store.getSetting('certificate_template')
            : await dbGetSetting('certificate_template');

        const verifyUrl = `${APP_URL}/api/certificate/${identifier}`;
        const qrDataUrl = await QRCode.toDataURL(verifyUrl, { width: 300, margin: 1 });
        const qrCodeHtml = `<img src="${qrDataUrl}" alt="qr" style="width:120px;height:120px;" />`;

        const studentName = user?.name || `User #${cert.user_id}`;
        const courseTitle = course?.title || `Course #${cert.course_id}`;
        const instructors = course?.instructors || [];
        const instructorHtml = instructors.map((i) => `<p>${i.name}</p>`).join('');
        const courseDuration = course?.total_duration || '—';
        const lessonCount = course?.lesson_count ?? 0;
        const courseLevel = course?.level ? course.level[0].toUpperCase() + course.level.slice(1) : '';
        const courseLanguage = course?.language ? course.language[0].toUpperCase() + course.language.slice(1) : '';
        const completionDate = dateFormatter(cert.created_at);
        const downloadDate = dateFormatter(new Date());

        let html = builderRaw || '';
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

        res.json({
            certificate: cert,
            html,
            student_name: studentName,
            course_title: courseTitle,
            verify_url: verifyUrl,
            qr_code: qrDataUrl,
        });
    } catch (err) {
        console.warn('[certificate.render]', err.message);
        res.status(500).json({ error: err.message });
    }
};
