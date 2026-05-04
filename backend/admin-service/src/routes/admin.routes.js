const router = require('express').Router();
const upload = require('../middlewares/multer');
const ctrl = require('../controllers/AdminController');
const dash = require('../controllers/DashboardController');

router.get('/dashboard', dash.index);

router.get('/admins', ctrl.index);
router.get('/admins/:id', ctrl.show);
router.post('/admins', upload.single('photo'), ctrl.store);
router.post('/admins/:id', upload.single('photo'), ctrl.update);
router.delete('/admins/:id', ctrl.destroy);

module.exports = router;
