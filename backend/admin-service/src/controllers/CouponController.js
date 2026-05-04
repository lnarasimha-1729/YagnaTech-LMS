const couponService = require('../services/CouponService');
const { asyncHandler } = require('../middlewares/error');

const getUserId = (req) => req.user?.id || 1;

exports.index = asyncHandler(async (req, res) => {
    const { page, search } = req.query;
    res.json(await couponService.list({ user_id: getUserId(req), page, search }));
});

exports.show = asyncHandler(async (req, res) => {
    res.json(await couponService.get({ id: req.params.id, user_id: getUserId(req) }));
});

exports.store = asyncHandler(async (req, res) => {
    res.json(await couponService.create({ body: req.body, user_id: getUserId(req) }));
});

exports.update = asyncHandler(async (req, res) => {
    res.json(await couponService.update({ id: req.params.id, body: req.body, user_id: getUserId(req) }));
});

exports.delete = asyncHandler(async (req, res) => {
    res.json(await couponService.remove({ id: req.params.id, user_id: getUserId(req) }));
});

exports.status = asyncHandler(async (req, res) => {
    res.json(await couponService.toggleStatus({ id: req.params.id, user_id: getUserId(req) }));
});
