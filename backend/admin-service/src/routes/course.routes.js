const router = require('express').Router();
const ctrl = require('../controllers/CourseController');
const upload = require('../middlewares/multer');

const mediaFields = upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'banner', maxCount: 1 },
    { name: 'preview', maxCount: 1 },
    { name: 'og_image', maxCount: 1 },
]);

router.get('/courses', ctrl.index);
router.get('/course/create', ctrl.create);
router.post('/course/store', mediaFields, ctrl.store);
router.get('/course/edit/:id', ctrl.edit);
router.post('/course/update/:id', mediaFields, ctrl.update);
router.get('/course/duplicate/:id', ctrl.duplicate);
router.get('/course/status/:type/:id', ctrl.status);
router.delete('/course/delete/:id', ctrl.delete);
router.get('/course/draft/:id', ctrl.draft);
router.post('/course/approval/:id', ctrl.approval);

module.exports = router;
