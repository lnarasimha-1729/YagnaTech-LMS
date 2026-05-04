const service = require('./media.service');
const asyncHandler = require('../../shared/utils/asyncHandler');

/**
 * Media library — uploads, browsing, deletion
 * TODO: mirror the CRUD/custom actions from FileController, MediaFile.
 */
exports.index = asyncHandler(async (req, res) => {
  res.json(await service.list(req.query));
});

exports.show = asyncHandler(async (req, res) => {
  res.json(await service.findById(req.params.id));
});
