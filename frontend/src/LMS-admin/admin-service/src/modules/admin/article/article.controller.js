const service = require('./article.service');
const asyncHandler = require('../../../shared/utils/asyncHandler');

/**
 * Admin article controller — 1:1 port of Admin/ArticleController.php.
 * Articles are KnowledgeBaseTopick rows under a parent KnowledgeBase.
 * index/create in Laravel were no-ops; show() was the real listing endpoint.
 */

exports.show = asyncHandler(async (req, res) => {
  res.json(await service.listByKnowledgeBase(req.params.id, req.query));
});

exports.edit = asyncHandler(async (req, res) => {
  res.json({ articleTitle: await service.getKnowledgeBase(req.params.id) });
});

exports.store = asyncHandler(async (req, res) => {
  const article = await service.create(req.body);
  res.status(201).json({ data: article, message: 'article saved.' });
});

exports.update = asyncHandler(async (req, res) => {
  const article = await service.update(req.params.id, req.body);
  res.json({ data: article, message: 'successfully updated.' });
});

exports.destroy = asyncHandler(async (req, res) => {
  const result = await service.remove(req.params.id);
  res.json({ ...result, message: 'article deleted' });
});
