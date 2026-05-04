const service = require('./wishlist.service');
const asyncHandler = require('../../shared/utils/asyncHandler');

/**
 * User wishlist add/remove
 * TODO: mirror the CRUD/custom actions from WishlistController.
 */
exports.index = asyncHandler(async (req, res) => {
  res.json(await service.list(req.query));
});

exports.show = asyncHandler(async (req, res) => {
  res.json(await service.findById(req.params.id));
});
