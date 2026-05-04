const router = require('express').Router();
const ctrl = require('../controllers/CouponController');

router.get('/coupons', ctrl.index);
router.get('/coupon/edit/:id', ctrl.show);
router.post('/coupon/store', ctrl.store);
router.post('/coupon/update/:id', ctrl.update);
router.delete('/coupon/delete/:id', ctrl.delete);
router.get('/coupon/status/:id', ctrl.status);

module.exports = router;
