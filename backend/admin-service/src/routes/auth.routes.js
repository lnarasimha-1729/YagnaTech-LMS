const router = require('express').Router();
const ctrl = require('../controllers/AuthController');
const { adminOnly, adminOrInstructor } = require('../middlewares/auth');
const upload = require('../middlewares/multer');

router.post('/auth/login', ctrl.login);
router.get('/auth/me', adminOnly, ctrl.me);
router.post('/auth/logout', adminOnly, ctrl.logout);
// Any signed-in account in the admin shell (admin / college admin / instructor)
// can change their own password / update their own profile.
router.post('/auth/change-password', adminOrInstructor, ctrl.changePassword);
// multipart: optional `photo` file + text fields. Same parser instructors use.
router.post('/auth/update-profile', adminOrInstructor, upload.single('photo'), ctrl.updateProfile);

module.exports = router;
