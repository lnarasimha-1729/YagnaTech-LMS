const service = require('./file.service');
const asyncHandler = require('../../shared/utils/asyncHandler');

/**
 * Uploads, watermarking, signed media delivery
 * TODO: mirror the CRUD/custom actions from FileController, WatermarkController.
 */
exports.index = asyncHandler(async (req, res) => {
  res.json(await service.list(req.query));
});

exports.show = asyncHandler(async (req, res) => {
  res.json(await service.findById(req.params.id));
});
