const { Op } = require('sequelize');
const { BootcampCategory } = require('../../../models');
const AppError = require('../../../shared/errors/AppError');
const { slug } = require('../../../shared/utils/slug');

/** Admin bootcamp-category service — 1:1 port of Admin/BootcampCategoryController.php. */

async function list({ page = 1, perPage = 32 } = {}) {
  const offset = (Number(page) - 1) * Number(perPage);
  const { rows, count } = await BootcampCategory.findAndCountAll({
    limit: Number(perPage),
    offset,
    order: [['id', 'DESC']],
  });
  return {
    data: rows,
    meta: { total: count, page: Number(page), perPage: Number(perPage) },
  };
}

async function assertUniqueTitle(title, excludeId = null) {
  const where = { title };
  if (excludeId) where.id = { [Op.ne]: excludeId };
  const existing = await BootcampCategory.findOne({ where });
  if (existing) throw new AppError('The title has already been taken.', 422);
}

async function create({ title }) {
  await assertUniqueTitle(title);
  return BootcampCategory.create({ title, slug: slug(title) });
}

async function update(id, { title }) {
  const cat = await BootcampCategory.findByPk(id);
  if (!cat) throw new AppError('Data not found.', 404);
  await assertUniqueTitle(title, id);
  await cat.update({ title, slug: slug(title) });
  return cat;
}

async function remove(id) {
  const cat = await BootcampCategory.findByPk(id);
  if (!cat) throw new AppError('Data not found.', 404);
  await cat.destroy();
  return { id: Number(id) };
}

module.exports = { list, create, update, remove };
