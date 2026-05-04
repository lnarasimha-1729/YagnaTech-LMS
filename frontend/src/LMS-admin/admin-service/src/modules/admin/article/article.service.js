const { KnowledgeBase, KnowledgeBaseTopick } = require('../../../models');
const AppError = require('../../../shared/errors/AppError');

/**
 * Admin article service — 1:1 port of Admin/ArticleController.php.
 * "Articles" in this codebase are KnowledgeBaseTopick rows scoped to a KnowledgeBase (topic_id).
 */

async function listByKnowledgeBase(knowledgeBaseId, { page = 1, perPage = 10 } = {}) {
  const kb = await KnowledgeBase.findByPk(knowledgeBaseId);
  if (!kb) throw new AppError('Data not found.', 404);
  const offset = (Number(page) - 1) * Number(perPage);
  const { rows, count } = await KnowledgeBaseTopick.findAndCountAll({
    where: { knowledge_base_id: knowledgeBaseId },
    order: [['updated_at', 'DESC']],
    limit: Number(perPage),
    offset,
  });
  return {
    articleTitle: kb,
    articles: {
      data: rows,
      meta: { total: count, page: Number(page), perPage: Number(perPage) },
    },
  };
}

async function getKnowledgeBase(id) {
  const kb = await KnowledgeBase.findByPk(id);
  if (!kb) throw new AppError('Data not found.', 404);
  return kb;
}

async function create({ title, description, topick_id }) {
  return KnowledgeBaseTopick.create({
    topic_name: title,
    description,
    knowledge_base_id: topick_id,
  });
}

async function update(id, { topic_name, description }) {
  const article = await KnowledgeBaseTopick.findByPk(id);
  if (!article) throw new AppError('Data not found.', 404);
  await article.update({ topic_name, description });
  return article;
}

async function remove(id) {
  const article = await KnowledgeBaseTopick.findByPk(id);
  if (!article) throw new AppError('Data not found.', 404);
  const knowledgeBaseId = article.knowledge_base_id;
  await article.destroy();
  return { id: Number(id), knowledge_base_id: knowledgeBaseId };
}

module.exports = { listByKnowledgeBase, getKnowledgeBase, create, update, remove };
