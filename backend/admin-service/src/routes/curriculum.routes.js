const router = require('express').Router();
const multer = require('multer');
const ctrl = require('../controllers/CurriculumController');
const { adminOrInstructor } = require('../middlewares/auth');

const upload = multer({ dest: 'tmp/' });

// `attachment` carries either a single document (document_type lesson) or
// one-to-many images (image lesson). Bumped to 20 so an admin can upload an
// image gallery in a single request — CurriculumService routes single-file
// uploads through the legacy single-filename path and multi-file uploads
// through a JSON-array path keyed off lesson_type === 'image'.
const lessonFiles = upload.fields([
    { name: 'attachment', maxCount: 20 },
    { name: 'scorm_file', maxCount: 1 },
    { name: 'system_video_file', maxCount: 1 },
]);

// All curriculum endpoints are usable by both admins and instructors. The
// service layer should additionally scope writes to courses the instructor
// owns / is assigned to — same model the zoom-live-class module uses.

// Sections
router.get('/course/:course_id/curriculum', adminOrInstructor, ctrl.sections_by_course);
router.post('/section', adminOrInstructor, ctrl.section_store);
router.post('/section/update', adminOrInstructor, ctrl.section_update);
router.get('/section/delete/:id', adminOrInstructor, ctrl.section_delete);
router.post('/section/sort', adminOrInstructor, ctrl.section_sort);

// Lessons
router.post('/lesson', adminOrInstructor, lessonFiles, ctrl.lesson_store);
router.post('/lesson/edit', adminOrInstructor, lessonFiles, ctrl.lesson_update);
router.get('/lesson/:id', adminOrInstructor, ctrl.lesson_show);
router.get('/lesson/delete/:id', adminOrInstructor, ctrl.lesson_delete);
router.post('/lesson/sort', adminOrInstructor, ctrl.lesson_sort);

module.exports = router;
