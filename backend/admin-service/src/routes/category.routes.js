const router = require('express').Router();
const ctrl = require('../controllers/CategoryController');
const upload = require('../middlewares/multer');

const fields = upload.fields([{ name: 'thumbnail', maxCount: 1 }, { name: 'category_logo', maxCount: 1 }]);

router.get('/categories', ctrl.index);
router.post('/category/store', fields, ctrl.store);
router.post('/category/update/:id', fields, ctrl.update);
router.delete('/category/delete/:id', ctrl.delete);

module.exports = router;
