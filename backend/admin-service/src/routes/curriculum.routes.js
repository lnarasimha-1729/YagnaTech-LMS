const router = require('express').Router();
const multer = require('multer');
const ctrl = require('../controllers/CurriculumController');

const upload = multer({ dest: 'tmp/' });

const lessonFiles = upload.fields([
    { name: 'attachment', maxCount: 1 },
    { name: 'scorm_file', maxCount: 1 },
    { name: 'system_video_file', maxCount: 1 },
]);

// Sections
router.get('/course/:course_id/curriculum', ctrl.sections_by_course);
router.post('/section', ctrl.section_store);
router.post('/section/update', ctrl.section_update);
router.get('/section/delete/:id', ctrl.section_delete);
router.post('/section/sort', ctrl.section_sort);

// Lessons
router.post('/lesson', lessonFiles, ctrl.lesson_store);
router.post('/lesson/edit', lessonFiles, ctrl.lesson_update);
router.get('/lesson/:id', ctrl.lesson_show);
router.get('/lesson/delete/:id', ctrl.lesson_delete);
router.post('/lesson/sort', ctrl.lesson_sort);

module.exports = router;
