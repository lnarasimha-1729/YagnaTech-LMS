const service = require('./coupon.service');
const asyncHandler = require('../../shared/utils/asyncHandler');

/**
 * Coupon codes — validate, apply, CRUD
 * TODO: mirror the CRUD/custom actions from CouponController.
 */
exports.index = asyncHandler(async (req, res) => {
  res.json(await service.list(req.query));
});

exports.show = asyncHandler(async (req, res) => {
  res.json(await service.findById(req.params.id));
});
