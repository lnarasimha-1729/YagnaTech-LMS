const { Op } = require('sequelize');
const {
  TeamTrainingPackage,
  TeamPackagePurchase,
  Course,
} = require('../../../models');
const AppError = require('../../../shared/errors/AppError');
const { slug } = require('../../../shared/utils/slug');
const { niceFileName, extOf } = require('../../../shared/utils/niceFileName');
const { uploadImage } = require('../../../shared/storage/imageUploader');
const { parsePagination, paginated } = require('../../../shared/utils/pagination');

/** 1:1 port of Admin/TeamTrainingController.php. */

function toEpoch(dateLike) {
  if (!dateLike) return null;
  const t = Date.parse(dateLike);
  return Number.isNaN(t) ? null : Math.floor(t / 1000);
}

function parseValidity(value) {
  if (!value) return [null, null];
  const [start, end] = String(value).split('-').map((s) => s.trim());
  return [toEpoch(start), toEpoch(end)];
}

function cleanFeatures(features) {
  if (!features) return [];
  const arr = Array.isArray(features) ? features : Object.values(features);
  return arr.filter((v) => v != null && String(v).trim() !== '');
}

async function assertTitleUnique({ userId, title, excludeId = null }) {
  const where = { title, user_id: userId };
  if (excludeId) where.id = { [Op.ne]: excludeId };
  if (await TeamTrainingPackage.count({ where })) {
    throw new AppError('Title already taken.', 422);
  }
  const slugWhere = { slug: slug(title), user_id: userId };
  if (excludeId) slugWhere.id = { [Op.ne]: excludeId };
  if (await TeamTrainingPackage.count({ where: slugWhere })) {
    throw new AppError('Slug already taken.', 422);
  }
}

async function list({ user, query }) {
  const where = { user_id: user.id };
  if (query.search) where.title = { [Op.like]: `%${query.search}%` };
  const pg = parsePagination(query, { page: 1, perPage: 20, max: 100 });
  const { rows, count } = await TeamTrainingPackage.findAndCountAll({
    where,
    order: [['id', 'DESC']],
    limit: pg.limit,
    offset: pg.offset,
    include: [{ model: Course, attributes: ['title', 'slug', 'price'] }],
  });
  return paginated(rows, count, pg);
}

async function create({ body, files, user }) {
  const thumb = files && files.thumbnail ? files.thumbnail[0] : null;
  if (!thumb) throw new AppError('Thumbnail is required.', 422);
  await assertTitleUnique({ userId: user.id, title: body.title });

  const [startDate, expiryDate] =
    body.expiry_type === 'limited' ? parseValidity(body.expiry_date) : [null, null];

  const relPath = `uploads/team_training/thumbnail/${niceFileName(body.title, extOf(thumb))}`;
  await uploadImage(thumb, relPath);

  return TeamTrainingPackage.create({
    user_id: user.id,
    title: body.title,
    slug: slug(body.title),
    course_privacy: body.course_privacy,
    course_id: body.course_id,
    allocation: body.allocation,
    pricing_type: body.pricing_type,
    price: body.price || null,
    expiry_type: body.expiry_type || null,
    start_date: startDate,
    expiry_date: expiryDate,
    thumbnail: relPath,
    features: JSON.stringify(cleanFeatures(body.features)),
    status: 1,
  });
}

async function update(id, { body, files, user }) {
  const row = await TeamTrainingPackage.findByPk(id);
  if (!row) throw new AppError('Package not found.', 404);
  await assertTitleUnique({ userId: user.id, title: body.title, excludeId: id });

  const [startDate, expiryDate] =
    body.expiry_type === 'limited' ? parseValidity(body.expiry_date) : [null, null];

  const data = {
    user_id: user.id,
    title: body.title,
    slug: slug(body.title),
    course_privacy: body.course_privacy,
    course_id: body.course_id,
    allocation: body.allocation,
    pricing_type: body.pricing_type,
    price: body.price || null,
    expiry_type: body.expiry_type || null,
    start_date: startDate,
    expiry_date: expiryDate,
    features: JSON.stringify(cleanFeatures(body.features)),
  };

  const thumb = files && files.thumbnail ? files.thumbnail[0] : null;
  if (thumb) {
    const relPath = `uploads/team_training/thumbnail/${niceFileName(body.title, extOf(thumb))}`;
    await uploadImage(thumb, relPath);
    data.thumbnail = relPath;
  }

  await row.update(data);
  return row;
}

async function findById(id) {
  const row = await TeamTrainingPackage.findByPk(id, {
    include: [{ model: Course, attributes: ['title', 'slug', 'price'] }],
  });
  if (!row) throw new AppError('Package not found.', 404);
  return row;
}

async function remove(id) {
  const row = await TeamTrainingPackage.findByPk(id);
  if (!row) throw new AppError('Package not found.', 404);
  await row.destroy();
  return { id: Number(id) };
}

async function duplicate(id, user) {
  const row = await TeamTrainingPackage.findByPk(id);
  if (!row) throw new AppError('Package not found.', 404);
  const data = row.get({ plain: true });
  delete data.id;
  delete data.created_at;
  delete data.updated_at;
  data.title = `${data.title} copy`;
  data.slug = slug(data.title);
  data.user_id = user.id;
  return TeamTrainingPackage.create(data);
}

async function getCourses({ privacy }) {
  if (!['public', 'private'].includes(privacy)) return [];
  const status = privacy === 'public' ? 'active' : 'private';
  return Course.findAll({ where: { status } });
}

async function getCoursePrice(courseId) {
  if (!courseId) return null;
  const row = await Course.findByPk(courseId, { attributes: ['price'] });
  return row ? row.price : null;
}

async function toggleStatus(id) {
  const row = await TeamTrainingPackage.findByPk(id);
  if (!row) throw new AppError('Package not found.', 404);
  await row.update({ status: row.status ? 0 : 1 });
  return row;
}

async function purchaseHistory(query) {
  const pg = parsePagination(query, { page: 1, perPage: 20, max: 100 });
  const { rows, count } = await TeamPackagePurchase.findAndCountAll({
    order: [['id', 'DESC']],
    limit: pg.limit,
    offset: pg.offset,
    include: [{ model: TeamTrainingPackage, as: 'package', attributes: ['user_id', 'title', 'slug', 'price'] }],
  });
  return paginated(rows, count, pg);
}

async function invoice(id, user) {
  const row = await TeamPackagePurchase.findOne({
    where: { id },
    include: [
      {
        model: TeamTrainingPackage,
        as: 'package',
        where: { user_id: user.id },
        attributes: ['title', 'slug'],
        required: true,
      },
    ],
  });
  if (!row) throw new AppError('Invoice not found.', 404);
  return row;
}

module.exports = {
  list,
  create,
  update,
  findById,
  remove,
  duplicate,
  getCourses,
  getCoursePrice,
  toggleStatus,
  purchaseHistory,
  invoice,
};
