const { Op } = require('sequelize');
const {
  Bootcamp,
  BootcampCategory,
  BootcampModule,
  BootcampPurchase,
  SeoField,
} = require('../../../models');
const AppError = require('../../../shared/errors/AppError');
const storage = require('../../../shared/storage');
const { uploadImage } = require('../../../shared/storage/imageUploader');
const { niceFileName, extOf } = require('../../../shared/utils/niceFileName');
const { slug } = require('../../../shared/utils/slug');

/**
 * Admin bootcamp service — 1:1 port of Admin/BootcampController.php.
 * Admin role bypasses the user_id scope; instructors only see their own bootcamps.
 * update() is tab-driven (basic/pricing/info/media/seo) to mirror the PHP controller.
 */

async function list({ user, query = {} }) {
  const where = {};
  if (user.role !== 'admin') where.user_id = user.id;
  if (query.search) where.title = { [Op.like]: `%${query.search}%` };

  if (query.category && query.category !== 'all') {
    const cat = await BootcampCategory.findOne({ where: { slug: query.category } });
    if (cat) where.category_id = cat.id;
  }
  if (query.status && query.status !== 'all') {
    where.status = query.status === 'active' ? 1 : 0;
  }
  if (query.instructor && query.instructor !== 'all') {
    where.user_id = query.instructor;
  }
  if (query.price && query.price !== 'all') {
    if (query.price === 'free') where.is_paid = 0;
    else if (query.price === 'discounted') where.discount_flag = 1;
    else if (query.price === 'paid') where.is_paid = 1;
  }

  const page = Number(query.page || 1);
  const perPage = Number(query.perPage || 20);
  const { rows, count } = await Bootcamp.findAndCountAll({
    where,
    include: [{ model: BootcampCategory, attributes: ['title', 'slug'] }],
    limit: perPage,
    offset: (page - 1) * perPage,
    order: [['id', 'DESC']],
  });
  return { data: rows, meta: { total: count, page, perPage } };
}

async function findOwned(id, user) {
  const where = { id };
  if (user.role !== 'admin') where.user_id = user.id;
  const bootcamp = await Bootcamp.findOne({ where });
  return bootcamp;
}

async function getEdit(id, user) {
  const bootcamp = await findOwned(id, user);
  if (!bootcamp) throw new AppError('Data not found.', 404);
  const modules = await BootcampModule.findAll({
    where: { bootcamp_id: id },
    order: [['sort', 'ASC']],
  });
  return { bootcamp_details: bootcamp, modules };
}

async function assertTitleAvailable({ userId, title, excludeId = null }) {
  const where = { user_id: userId, title };
  if (excludeId) where.id = { [Op.ne]: excludeId };
  const taken = await Bootcamp.findOne({ where });
  if (taken) throw new AppError('This title has been taken.', 422);
}

function toEpoch(dateLike) {
  if (dateLike === undefined || dateLike === null || dateLike === '') return null;
  const n = Number(dateLike);
  if (Number.isFinite(n) && n > 0) return Math.floor(n);
  const t = Date.parse(dateLike);
  return Number.isNaN(t) ? null : Math.floor(t / 1000);
}

async function create({ body, files, user }) {
  await assertTitleAvailable({ userId: user.id, title: body.title });
  const data = {
    user_id: user.id,
    title: body.title,
    slug: slug(body.title),
    short_description: body.short_description || null,
    description: body.description,
    publish_date: toEpoch(body.publish_date),
    category_id: body.category_id,
    is_paid: body.is_paid,
    price: body.price || null,
    discount_flag: body.discount_flag || null,
    discounted_price: body.discounted_price || null,
    status: 1,
  };
  const thumb = files && files.thumbnail && files.thumbnail[0];
  if (thumb) {
    data.thumbnail = `uploads/bootcamp/thumbnail/${niceFileName(body.title, extOf(thumb))}`;
    await uploadImage(thumb, data.thumbnail);
  }
  return Bootcamp.create(data);
}

async function remove(id, user) {
  const bootcamp = await findOwned(id, user);
  if (!bootcamp) throw new AppError('Data not found.', 404);
  await bootcamp.destroy();
  return { id: Number(id) };
}

function cleanArray(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.filter((v) => v !== null && v !== undefined && v !== '');
}

function buildFaqs({ faq_title, faq_description }) {
  const titles = Array.isArray(faq_title) ? faq_title : [];
  const descs = Array.isArray(faq_description) ? faq_description : [];
  const out = [];
  for (let i = 0; i < titles.length; i += 1) {
    if (titles[i]) out.push({ title: titles[i], description: descs[i] || '' });
  }
  return out;
}

function pluckMetaKeywords(raw) {
  if (!raw) return '';
  let arr = raw;
  if (typeof raw === 'string') {
    try {
      arr = JSON.parse(raw);
    } catch {
      return raw;
    }
  }
  if (!Array.isArray(arr)) return '';
  return arr.map((o) => (o && o.value !== undefined ? o.value : o)).join(', ');
}

async function update(id, { body, files, user }) {
  const bootcamp = await findOwned(id, user);
  if (!bootcamp) throw new AppError('Data not found.', 404);
  const tab = body.tab;
  if (!tab) throw new AppError('Data not found.', 422);

  const data = {};
  if (tab === 'basic') {
    await assertTitleAvailable({ userId: user.id, title: body.title, excludeId: id });
    Object.assign(data, {
      title: body.title,
      slug: slug(body.title),
      short_description: body.short_description || null,
      description: body.description,
      publish_date: toEpoch(body.publish_date),
      category_id: body.category_id,
    });
  } else if (tab === 'pricing') {
    Object.assign(data, {
      is_paid: body.is_paid,
      price: body.price || null,
      discount_flag: body.discount_flag || null,
      discounted_price: body.discounted_price || null,
    });
  } else if (tab === 'info') {
    data.requirements = JSON.stringify(cleanArray(body.requirements));
    data.outcomes = JSON.stringify(cleanArray(body.outcomes));
    data.faqs = JSON.stringify(buildFaqs(body));
  } else if (tab === 'media') {
    const thumb = files && files.thumbnail && files.thumbnail[0];
    if (thumb) {
      data.thumbnail = `uploads/bootcamp/thumbnail/${niceFileName(body.title || bootcamp.title, extOf(thumb))}`;
      await uploadImage(thumb, data.thumbnail);
      if (bootcamp.thumbnail) await storage.remove(bootcamp.thumbnail).catch(() => {});
    }
  } else if (tab === 'seo') {
    const existing = await SeoField.findOne({ where: { bootcamp_id: id } });
    const seoData = {
      bootcamp_id: id,
      route: 'Bootcamp Details',
      name_route: 'bootcamp.details',
      meta_title: body.meta_title,
      meta_description: body.meta_description,
      meta_robot: body.meta_robot,
      canonical_url: body.canonical_url,
      custom_url: body.custom_url,
      json_ld: body.json_ld,
      og_title: body.og_title,
      og_description: body.og_description,
      meta_keywords: pluckMetaKeywords(body.meta_keywords),
    };
    const ogImage = files && files.og_image && files.og_image[0];
    if (ogImage) {
      const destPath = `uploads/seo-og-images/${id}-${ogImage.originalname}`;
      await uploadImage(ogImage, destPath, { maxWidth: 600 });
      if (existing && existing.og_image) await storage.remove(existing.og_image).catch(() => {});
      seoData.og_image = destPath;
    }
    if (existing) {
      await existing.update(seoData);
    } else {
      await SeoField.create(seoData);
    }
  }

  if (Object.keys(data).length) await bootcamp.update(data);
  return bootcamp;
}

async function duplicate(id, user) {
  const source = await Bootcamp.findByPk(id);
  if (!source) throw new AppError('Data not found.', 404);
  const copy = source.toJSON();
  delete copy.id;
  delete copy.created_at;
  delete copy.updated_at;
  copy.title = `${source.title} copy`;
  copy.slug = slug(copy.title);
  copy.user_id = user.id;
  copy.status = 1;
  return Bootcamp.create(copy);
}

async function toggleStatus(id, user) {
  const bootcamp = await findOwned(id, user);
  if (!bootcamp) throw new AppError('Data not found.', 404);
  const next = bootcamp.status ? 0 : 1;
  await bootcamp.update({ status: next });
  return { status: next };
}

async function purchaseHistory({ page = 1, perPage = 20 } = {}) {
  const p = Number(page);
  const pp = Number(perPage);
  const { rows, count } = await BootcampPurchase.findAndCountAll({
    include: [
      {
        model: Bootcamp,
        attributes: ['user_id', 'title', 'slug', 'price'],
      },
    ],
    order: [['id', 'DESC']],
    limit: pp,
    offset: (p - 1) * pp,
  });
  return { data: rows, meta: { total: count, page: p, perPage: pp } };
}

async function invoice(id) {
  const purchase = await BootcampPurchase.findByPk(id, {
    include: [{ model: Bootcamp, attributes: ['title', 'slug'] }],
  });
  if (!purchase) throw new AppError('Data not found.', 404);
  return purchase;
}

module.exports = {
  list,
  getEdit,
  create,
  update,
  remove,
  duplicate,
  toggleStatus,
  purchaseHistory,
  invoice,
};
