const router = require('express').Router();
const c = require('./cart.controller');
const { authenticate } = require('../../shared/middleware/auth.middleware');

/**
 * Shopping cart (student-scoped). All routes require an authenticated user.
 *
 * GET    /api/cart                — list items + tax + optional coupon preview
 * POST   /api/cart/apply-coupon   — validate coupon, return { coupon }
 * POST   /api/cart/:courseId      — add course to cart
 * DELETE /api/cart/:courseId      — remove course from cart
 */
router.use(authenticate);

router.get('/', c.index);
router.post('/apply-coupon', c.applyCoupon);
router.post('/:courseId', c.add);
router.delete('/:courseId', c.remove);

module.exports = router;
