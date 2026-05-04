const service = require('./notification.service');
const asyncHandler = require('../../shared/utils/asyncHandler');

/**
 * In-app notifications + settings
 * TODO: mirror the CRUD/custom actions from NotificationController.
 */
exports.index = asyncHandler(async (req, res) => {
  res.json(await service.list(req.query));
});

exports.show = asyncHandler(async (req, res) => {
  res.json(await service.findById(req.params.id));
});
