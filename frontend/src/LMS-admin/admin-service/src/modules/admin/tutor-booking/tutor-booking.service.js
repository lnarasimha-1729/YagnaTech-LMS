const { Op } = require('sequelize');
const { TutorCategory, TutorSubject } = require('../../../models');
const AppError = require('../../../shared/errors/AppError');
const { slug } = require('../../../shared/utils/slug');
const { parsePagination, paginated } = require('../../../shared/utils/pagination');

/** 1:1 port of Admin/TutorBookingController.php (subject + category CRUD). */

async function listSubjects(query) {
  const pg = parsePagination(query, { page: 1, perPage: 10, max: 100 });
  const { rows, count } = await TutorSubject.findAndCountAll({
    order: [['id', 'ASC']],
    limit: pg.limit,
    offset: pg.offset,
  });
  return paginated(rows, count, pg);
}

async function createSubject({ body }) {
  const s = slug(body.name);
  const exists = await TutorSubject.count({ where: { slug: s } });
  if (exists > 0) throw new AppError('There cannot be more than one subject with the same name. Please change your subject name', 422);
  return TutorSubject.create({ name: body.name, slug: s, status: '1' });
}

async function updateSubject(id, { body }) {
  const row = await TutorSubject.findByPk(id);
  if (!row) throw new AppError('Data not found.', 404);
  const s = slug(body.name);
  const exists = await TutorSubject.count({ where: { slug: s, id: { [Op.ne]: id } } });
  if (exists > 0) throw new AppError('There cannot be more than one subject with the same name. Please change your subject name', 422);
  await row.update({ name: body.name, slug: s, status: '1' });
  return row;
}

async function setSubjectStatus(id, status) {
  const row = await TutorSubject.findByPk(id);
  if (!row) throw new AppError('Data not found.', 404);
  await row.update({ status: status === 'active' ? '1' : '0' });
  return row;
}

async function deleteSubject(id) {
  const row = await TutorSubject.findByPk(id);
  if (!row) throw new AppError('Data not found.', 404);
  await row.destroy();
  return { id: Number(id) };
}

async function listCategories(query) {
  const pg = parsePagination(query, { page: 1, perPage: 10, max: 100 });
  const { rows, count } = await TutorCategory.findAndCountAll({
    order: [['id', 'ASC']],
    limit: pg.limit,
    offset: pg.offset,
  });
  return paginated(rows, count, pg);
}

async function createCategory({ body }) {
  const s = slug(body.name);
  const exists = await TutorCategory.count({ where: { slug: s } });
  if (exists > 0) throw new AppError('There cannot be more than one subject category with the same name. Please change your subject category name', 422);
  return TutorCategory.create({ name: body.name, slug: s, status: 1 });
}

async function updateCategory(id, { body }) {
  const row = await TutorCategory.findByPk(id);
  if (!row) throw new AppError('Data not found.', 404);
  const s = slug(body.name);
  const exists = await TutorCategory.count({ where: { slug: s, id: { [Op.ne]: id } } });
  if (exists > 0) throw new AppError('There cannot be more than one subject category with the same name. Please change your subject category name', 422);
  await row.update({ name: body.name, slug: s });
  return row;
}

async function setCategoryStatus(id, status) {
  const row = await TutorCategory.findByPk(id);
  if (!row) throw new AppError('Data not found.', 404);
  await row.update({ status: status === 'active' ? 1 : 0 });
  return row;
}

async function deleteCategory(id) {
  const row = await TutorCategory.findByPk(id);
  if (!row) throw new AppError('Data not found.', 404);
  await row.destroy();
  return { id: Number(id) };
}

module.exports = {
  listSubjects,
  createSubject,
  updateSubject,
  setSubjectStatus,
  deleteSubject,
  listCategories,
  createCategory,
  updateCategory,
  setCategoryStatus,
  deleteCategory,
};
