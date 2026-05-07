const service = require('./message.service');
const asyncHandler = require('../../shared/utils/asyncHandler');

/**
 * User-to-user messaging threads
 * TODO: mirror the CRUD/custom actions from MessageController.
 */
exports.index = asyncHandler(async (req, res) => {
  res.json(await service.list(req.query));
});

exports.show = asyncHandler(async (req, res) => {
  res.json(await service.findById(req.params.id));
});
