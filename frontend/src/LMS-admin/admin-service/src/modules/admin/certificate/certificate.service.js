const { Op } = require('sequelize');
const crypto = require('crypto');
const { Certificate, Setting, User, Course } = require('../../../models');
const AppError = require('../../../shared/errors/AppError');
const storage = require('../../../shared/storage');
const { uploadImage } = require('../../../shared/storage/imageUploader');
const { niceFileName, extOf } = require('../../../shared/utils/niceFileName');
const { parsePagination, paginated } = require('../../../shared/utils/pagination');
const env = require('../../../config/env');

/**
 * Admin certificate service — combines:
 *   1. CRUD + status toggle (Coupon-style table page).
 *   2. Settings/template/builder upload + issue/render flow ported from
 *      certificate-module/backend/src/controllers/CertificateController.js.
 *
 * Settings live in the shared `settings` table under types
 * `certificate_template` and `certificate_builder_content`, mirroring the
 * Laravel `SettingController`. The `Certificate` row stores per-issue identifier.
 */

const SETTING_TYPES = {
  template: 'certificate_template',
  builder: 'certificate_builder_content',
};

const APP_URL = env.appUrl || 'http://localhost:4000';

// ---------- helpers ----------

// Mirrors Laravel helpers/random.php — 12-char alphanumeric.
function generateIdentifier(len = 12) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let out = '';
  const bytes = crypto.randomBytes(len);
  for (let i = 0; i < len; i++) out += chars[bytes[i] % chars.length];
  return out;
}

async function getSetting(type) {
  const row = await Setting.findOne({ where: { type } });
  return row ? row.description : '';
}

async function setSetting(type, description) {
  const row = await Setting.findOne({ where: { type } });
  if (row) await row.update({ description });
  else await Setting.create({ type, description });
}

function dateFormatter(d) {
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return '';
  return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Tolerant lookups for legacy DBs whose users/courses tables don't match the
// Sequelize model (e.g. missing columns). Returns null on any error.
async function safeFindUser(id) {
  if (!id) return null;
  try {
    return await User.findByPk(id, { attributes: ['id', 'name', 'email'] });
  } catch { return null; }
}
async function safeFindCourse(id) {
  if (!id) return null;
  try {
    return await Course.findByPk(id, { attributes: ['id', 'title', 'slug'] });
  } catch { return null; }
}

// ---------- table CRUD (existing) ----------

async function list(query = {}) {
  const { page, perPage, limit, offset } = parsePagination(query);
  const where = {};
  if (query.search && String(query.search).trim() !== '') {
    const term = `%${String(query.search).trim()}%`;
    where[Op.or] = [
      { title: { [Op.like]: term } },
      { identifier: { [Op.like]: term } },
    ];
  }

  // Same defensive pattern as renderByIdentifier — try with the join, fall
  // back to a plain query if the legacy DB's users/courses schema can't be
  // joined. The list page tolerates missing user/course objects.
  let rows; let count;
  try {
    const result = await Certificate.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit,
      offset,
      include: [
        { model: User, as: 'User', attributes: ['id', 'name', 'email'], required: false },
        { model: Course, as: 'Course', attributes: ['id', 'title', 'slug'], required: false },
      ],
    });
    rows = result.rows; count = result.count;
  } catch (err) {
    console.warn('[certificate.list] include failed, falling back:', err.message);
    const result = await Certificate.findAndCountAll({
      where, order: [['created_at', 'DESC']], limit, offset,
    });
    rows = result.rows; count = result.count;
  }

  const wrapped = paginated(rows, count, { page, perPage });
  return {
    certificates: {
      data: wrapped.data.map((row) => {
        const obj = row.toJSON ? row.toJSON() : row;
        if (obj.User) obj.user = obj.User;
        if (obj.Course) obj.course = obj.Course;
        delete obj.User; delete obj.Course;
        return obj;
      }),
      total: wrapped.meta.total,
      current_page: wrapped.meta.current_page,
      last_page: wrapped.meta.last_page,
      per_page: wrapped.meta.per_page,
    },
  };
}

async function findOne(id) {
  const certificate = await Certificate.findByPk(id);
  if (!certificate) throw new AppError(`Certificate #${id} not found`, 404);
  return { certificate };
}

function normaliseStatus(value) {
  if (value === undefined || value === null || value === '') return 1;
  const n = Number(value);
  return Number.isFinite(n) && n === 0 ? 0 : 1;
}

async function create({ body, files }) {
  const data = {
    title: body.title,
    description: body.description || null,
    status: normaliseStatus(body.status),
    identifier: generateIdentifier(),
  };

  const image = files && files.template_image && files.template_image[0];
  if (image) {
    data.template_image = `uploads/certificate-template/${niceFileName(body.title, extOf(image))}`;
    await uploadImage(image, data.template_image, { maxWidth: 1600 });
  }

  return Certificate.create(data);
}

async function update(id, { body, files }) {
  const existing = await Certificate.findByPk(id);
  if (!existing) throw new AppError(`Certificate #${id} not found`, 404);

  const data = {
    title: body.title,
    description: body.description || null,
    status: normaliseStatus(body.status),
  };

  const image = files && files.template_image && files.template_image[0];
  if (image) {
    data.template_image = `uploads/certificate-template/${niceFileName(body.title, extOf(image))}`;
    await uploadImage(image, data.template_image, { maxWidth: 1600 });
    if (existing.template_image) await storage.remove(existing.template_image).catch(() => {});
  }

  await existing.update(data);
  return existing;
}

async function remove(id) {
  const existing = await Certificate.findByPk(id);
  if (!existing) throw new AppError(`Certificate #${id} not found`, 404);
  if (existing.template_image) await storage.remove(existing.template_image).catch(() => {});
  await existing.destroy();
  return { id: Number(id) };
}

async function toggleStatus(id) {
  const existing = await Certificate.findByPk(id);
  if (!existing) throw new AppError(`Certificate #${id} not found`, 404);
  await existing.update({ status: existing.status ? 0 : 1 });
  return existing;
}

// ---------- settings (template + builder) ----------

async function getCertificateSettings() {
  const [tpl, html] = await Promise.all([
    getSetting(SETTING_TYPES.template),
    getSetting(SETTING_TYPES.builder),
  ]);
  return {
    certificate_template: tpl || '',
    certificate_builder_content: html || '',
  };
}

async function uploadTemplate(file) {
  if (!file) throw new AppError('certificate_template is required', 422);

  const previous = await getSetting(SETTING_TYPES.template);
  const filename = `${Date.now()}-${niceFileName('certificate-template', extOf(file))}`;
  const newPath = `uploads/certificate-template/${filename}`;

  await uploadImage(file, newPath, { maxWidth: 1600 });
  if (previous && previous !== newPath) await storage.remove(previous).catch(() => {});
  await setSetting(SETTING_TYPES.template, newPath);

  // Mirror Laravel behaviour: rewrite <img src> in saved builder HTML so it
  // immediately uses the new template image.
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
}

async function updateBuilder(html) {
  if (!html) throw new AppError('certificate_builder_content is required', 422);
  await setSetting(SETTING_TYPES.builder, html);
  return { success: 'Certificate builder template has been updated' };
}

// ---------- issue / render ----------

async function issue({ user_id, course_id, progress }) {
  if (!user_id || !course_id) {
    throw new AppError('user_id and course_id are required', 422);
  }
  const pct = Number(progress);
  if (!Number.isFinite(pct) || pct < 100) {
    throw new AppError('Course progress must be 100% before a certificate can be issued.', 400);
  }

  const existing = await Certificate.findOne({ where: { user_id, course_id } });
  if (existing) {
    return { certificate: existing.toJSON(), created: false };
  }
  const row = await Certificate.create({
    user_id,
    course_id,
    identifier: generateIdentifier(12),
    issued_at: new Date(),
  });
  return { certificate: row.toJSON(), created: true };
}

async function renderByIdentifier(identifier) {
  // Lazy-require qrcode so the rest of the service still loads if it's missing
  // (e.g., before `npm install`). The endpoint itself will 500 with a clear msg.
  let QRCode;
  try {
    QRCode = require('qrcode');
  } catch {
    throw new AppError('qrcode package not installed. Run: npm install qrcode', 500);
  }

  // Try with the User/Course join first, but fall back to a plain lookup if
  // the live DB's schema diverges from the model (e.g. legacy users table
  // without an `id` column). The cert page can still render with placeholder
  // names when the join is unavailable.
  let row;
  try {
    row = await Certificate.findOne({
      where: { identifier },
      include: [
        { model: User, as: 'User', required: false },
        { model: Course, as: 'Course', required: false },
      ],
    });
  } catch (err) {
    console.warn('[certificate.render] include failed, falling back:', err.message);
    row = await Certificate.findOne({ where: { identifier } });
  }
  if (!row) throw new AppError('Certificate not found at this url', 404);

  const cert = row.toJSON();
  const user = cert.User || (await safeFindUser(cert.user_id));
  const course = cert.Course || (await safeFindCourse(cert.course_id));

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
  const courseLevel = course?.level
    ? course.level[0].toUpperCase() + course.level.slice(1)
    : '';
  const courseLanguage = course?.language
    ? course.language[0].toUpperCase() + course.language.slice(1)
    : '';
  const completionDate = dateFormatter(cert.issued_at || cert.created_at);
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

  delete cert.User; delete cert.Course;
  return {
    certificate: cert,
    html,
    student_name: studentName,
    course_title: courseTitle,
    verify_url: verifyUrl,
    qr_code: qrDataUrl,
  };
}

module.exports = {
  // table CRUD
  list, findOne, create, update, remove, toggleStatus,
  // settings + builder
  getCertificateSettings, uploadTemplate, updateBuilder,
  // issue / render
  issue, renderByIdentifier,
};
