const router = require('express').Router();
const upload = require('../middlewares/multer');
const { rootOnly } = require('../middlewares/auth');
const ctrl = require('../controllers/AdminController');
const dash = require('../controllers/DashboardController');

// Root-only: the global dashboard and managing other admins. Mounted with `auth`
// only (see server.js), so rootOnly is applied here per-route — keeps college
// admins out of these without blocking the rest of /api/admin for them.
router.get('/dashboard', rootOnly, dash.index);

router.get('/admins', rootOnly, ctrl.index);
router.get('/admins/:id', rootOnly, ctrl.show);
router.post('/admins', rootOnly, upload.single('photo'), ctrl.store);
router.post('/admins/:id', rootOnly, upload.single('photo'), ctrl.update);
router.delete('/admins/:id', rootOnly, ctrl.destroy);

module.exports = router;
