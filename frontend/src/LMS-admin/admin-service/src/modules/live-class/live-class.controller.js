const service = require('./live-class.service');
const asyncHandler = require('../../shared/utils/asyncHandler');

/**
 * Scheduled live classes (Zoom/meeting providers)
 * TODO: mirror the CRUD/custom actions from LiveClassController, ZoomMeetingController.
 */
exports.index = asyncHandler(async (req, res) => {
  res.json(await service.list(req.query));
});

exports.show = asyncHandler(async (req, res) => {
  res.json(await service.findById(req.params.id));
});
