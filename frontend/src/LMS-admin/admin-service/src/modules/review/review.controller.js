const service = require('./review.service');
const asyncHandler = require('../../shared/utils/asyncHandler');

/**
 * Course/instructor/bootcamp reviews + like/dislike
 * TODO: mirror the CRUD/custom actions from ReviewController.
 */
exports.index = asyncHandler(async (req, res) => {
  res.json(await service.list(req.query));
});

exports.show = asyncHandler(async (req, res) => {
  res.json(await service.findById(req.params.id));
});
