const { Op } = require('sequelize');
const crypto = require('crypto');
const { Certificate } = require('../../models');
const AppError = require('../../shared/errors/AppError');
const storage = require('../../shared/storage');
const { uploadImage } = require('../../shared/storage/imageUploader');
const { niceFileName, extOf } = require('../../shared/utils/niceFileName');
const { parsePagination, paginated } = require('../../shared/utils/pagination');

/**
 * Certificate service — mirror of modules/admin/certificate/certificate.service.
 * Same CRUD + toggle behaviour, same response envelope so any caller can use either mount.
 */

function generateIdentifier() {
  return crypto.randomBytes(8).toString('hex').toUpperCase();
}

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

  const { rows, count } = await Certificate.findAndCountAll({
    where,
    order: [['created_at', 'DESC']],
    limit,
    offset,
  });

  const wrapped = paginated(rows, count, { page, perPage });
  return {
    certificates: {
      data: wrapped.data,
      total: wrapped.meta.total,
      current_page: wrapped.meta.current_page,
      last_page: wrapped.meta.last_page,
      per_page: wrapped.meta.per_page,
    },
  };
}

async function findById(id) {
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

module.exports = { list, findById, create, update, remove, toggleStatus };
