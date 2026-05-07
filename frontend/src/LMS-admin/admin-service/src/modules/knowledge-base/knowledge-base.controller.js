const service = require('./knowledge-base.service');
const asyncHandler = require('../../shared/utils/asyncHandler');

/**
 * KB categories + topics
 * TODO: mirror the CRUD/custom actions from Admin/KnowledgeBaseController, Frontend/KnowledgeBaseController.
 */
exports.index = asyncHandler(async (req, res) => {
  res.json(await service.list(req.query));
});

exports.show = asyncHandler(async (req, res) => {
  res.json(await service.findById(req.params.id));
});
