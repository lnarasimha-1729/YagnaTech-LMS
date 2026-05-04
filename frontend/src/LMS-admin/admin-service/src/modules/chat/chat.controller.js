const service = require('./chat.service');
const asyncHandler = require('../../shared/utils/asyncHandler');

/**
 * Realtime chat / DMs (may need websocket layer)
 * TODO: mirror the CRUD/custom actions from ChatController.
 */
exports.index = asyncHandler(async (req, res) => {
  res.json(await service.list(req.query));
});

exports.show = asyncHandler(async (req, res) => {
  res.json(await service.findById(req.params.id));
});
