const router = require('express').Router();
const c = require('./coupon.controller');

/**
 * Coupon codes — validate, apply, CRUD
 * Laravel source: CouponController
 *
 * TODO: port Laravel route definitions from routes/web.php / routes/api.php.
 * Mount under /api/coupon from src/modules/index.js.
 */
router.get('/', c.index);
router.get('/:id', c.show);

module.exports = router;
