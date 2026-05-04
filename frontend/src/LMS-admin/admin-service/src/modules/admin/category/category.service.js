const { Category } = require('../../../models');
const AppError = require('../../../shared/errors/AppError');
const storage = require('../../../shared/storage');
const { uploadImage } = require('../../../shared/storage/imageUploader');
const { niceFileName, extOf } = require('../../../shared/utils/niceFileName');
const { slug } = require('../../../shared/utils/slug');

/**
 * Admin category service — 1:1 port of Admin/CategoryController.php.
 * JSON responses replace Laravel's redirect-with-flash since this feeds a React SPA.
 */

async function list() {
  // Laravel: Category::where('parent_id', null)->orderBy('sort', 'asc')->get()
  return Category.findAll({
    where: { parent_id: null },
    order: [['sort', 'ASC']],
    include: [{ association: 'children' }],
  });
}

function nullableParent(value) {
  if (value === undefined || value === null || value === '' || value === '0') return null;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

async function create({ body, files }) {
  const titleSlug = slug(body.title);
  const dup = await Category.count({ where: { slug: titleSlug } });
  if (dup > 0) {
    throw new AppError(
      'There cannot be more than one category with the same name. Please change your category name',
      422
    );
  }

  const data = {
    parent_id: nullableParent(body.parent_id),
    title: body.title,
    slug: titleSlug,
    icon: body.icon,
    sort: 0,
    keywords: body.keywords || null,
    description: body.description || null,
  };

  const thumb = files && files.thumbnail && files.thumbnail[0];
  if (thumb) {
    data.thumbnail = `uploads/category-thumbnail/${niceFileName(body.title, extOf(thumb))}`;
    await uploadImage(thumb, data.thumbnail, { maxWidth: 500 });
  }

  const logo = files && files.category_logo && files.category_logo[0];
  if (logo) {
    data.category_logo = `uploads/category-logo/${niceFileName(`${body.title} logo`, extOf(logo))}`;
    await uploadImage(logo, data.category_logo, { maxWidth: 400 });
  }

  return Category.create(data);
}

async function update(id, { body, files }) {
  const existing = await Category.findByPk(id);
  if (!existing) throw new AppError(`Category #${id} not found`, 404);

  const titleSlug = slug(body.title);
  const dup = await Category.count({ where: { slug: titleSlug, id: { [require('sequelize').Op.ne]: id } } });
  if (dup > 0) {
    throw new AppError(
      'There cannot be more than one category with the same name. Please change your category name',
      422
    );
  }

  const data = {
    parent_id: nullableParent(body.parent_id),
    title: body.title,
    slug: titleSlug,
    icon: body.icon,
    keywords: body.keywords || null,
    description: body.description || null,
  };

  const thumb = files && files.thumbnail && files.thumbnail[0];
  if (thumb) {
    data.thumbnail = `uploads/category-thumbnail/${niceFileName(body.title, extOf(thumb))}`;
    await uploadImage(thumb, data.thumbnail, { maxWidth: 500 });
    if (existing.thumbnail) await storage.remove(existing.thumbnail).catch(() => {});
  }

  const logo = files && files.category_logo && files.category_logo[0];
  if (logo) {
    data.category_logo = `uploads/category-logo/${niceFileName(`${body.title}-logo`, extOf(logo))}`;
    await uploadImage(logo, data.category_logo, { maxWidth: 400 });
    if (existing.category_logo) await storage.remove(existing.category_logo).catch(() => {});
  }

  await existing.update(data);
  return existing;
}

async function remove(id) {
  const cat = await Category.findByPk(id, { include: [{ association: 'children' }] });
  if (!cat) throw new AppError(`Category #${id} not found`, 404);

  // Laravel cascade: top-level → delete children (and their thumbnails) first.
  if (!cat.parent_id && cat.children && cat.children.length) {
    for (const child of cat.children) {
      if (child.thumbnail) await storage.remove(child.thumbnail).catch(() => {});
      await child.destroy();
    }
  }
  if (cat.thumbnail) await storage.remove(cat.thumbnail).catch(() => {});
  if (cat.category_logo) await storage.remove(cat.category_logo).catch(() => {});
  await cat.destroy();
  return { id: Number(id) };
}

module.exports = { list, create, update, remove };
