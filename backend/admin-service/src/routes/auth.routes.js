const router = require('express').Router();
const ctrl = require('../controllers/AuthController');
const { adminOnly } = require('../middlewares/auth');

router.post('/auth/login', ctrl.login);
router.get('/auth/me', adminOnly, ctrl.me);
router.post('/auth/logout', adminOnly, ctrl.logout);

module.exports = router;
