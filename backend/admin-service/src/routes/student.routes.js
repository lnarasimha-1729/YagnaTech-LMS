const router = require('express').Router();
const upload = require('../middlewares/multer');
const ctrl = require('../controllers/StudentController');

router.get('/students', ctrl.index);
router.get('/students/:id', ctrl.show);
router.post('/students', upload.single('photo'), ctrl.store);
router.post('/students/:id', upload.single('photo'), ctrl.update);
router.delete('/students/:id', ctrl.destroy);

module.exports = router;
