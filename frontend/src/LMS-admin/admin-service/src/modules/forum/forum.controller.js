const service = require('./forum.service');
const asyncHandler = require('../../shared/utils/asyncHandler');

/**
 * Course Q&A / forum threads + replies
 * TODO: mirror the CRUD/custom actions from ForumController.
 */
exports.index = asyncHandler(async (req, res) => {
  res.json(await service.list(req.query));
});

exports.show = asyncHandler(async (req, res) => {
  res.json(await service.findById(req.params.id));
});
