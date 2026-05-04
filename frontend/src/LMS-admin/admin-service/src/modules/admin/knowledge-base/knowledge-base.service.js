const { KnowledgeBase, KnowledgeBaseTopick } = require('../../../models');
const AppError = require('../../../shared/errors/AppError');

/**
 * Admin knowledge-base service — 1:1 port of Admin/KnowledgeBaseController.php.
 * destroy() cascades to child topicks (articles) the way Laravel's controller does.
 */

async function list({ page = 1, perPage = 10 } = {}) {
  const offset = (Number(page) - 1) * Number(perPage);
  const { rows, count } = await KnowledgeBase.findAndCountAll({
    order: [['created_at', 'DESC']],
    limit: Number(perPage),
    offset,
  });
  return {
    data: rows,
    meta: { total: count, page: Number(page), perPage: Number(perPage) },
  };
}

async function create({ title }) {
  return KnowledgeBase.create({ title });
}

async function update(id, { title }) {
  const kb = await KnowledgeBase.findByPk(id);
  if (!kb) throw new AppError('no data found', 404);
  await kb.update({ title });
  return kb;
}

async function remove(id) {
  const kb = await KnowledgeBase.findByPk(id);
  if (!kb) throw new AppError('something went wrong.', 404);
  await KnowledgeBaseTopick.destroy({ where: { knowledge_base_id: id } });
  await kb.destroy();
  return { id: Number(id) };
}

module.exports = { list, create, update, remove };
