const service = require('./cart.service');
const asyncHandler = require('../../shared/utils/asyncHandler');

exports.index = asyncHandler(async (req, res) => {
  const data = await service.list(req.user.id, req.query.coupon);
  res.json({ data });
});

exports.add = asyncHandler(async (req, res) => {
  const data = await service.add(req.user.id, Number(req.params.courseId));
  res.json({ data, message: 'Item added to the cart.' });
});

exports.remove = asyncHandler(async (req, res) => {
  const data = await service.remove(req.user.id, Number(req.params.courseId));
  res.json({ data, message: 'Item removed from cart.' });
});

exports.applyCoupon = asyncHandler(async (req, res) => {
  const data = await service.applyCoupon(req.body.code);
  res.json({ data });
});
