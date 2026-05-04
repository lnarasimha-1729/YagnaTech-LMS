const router = require('express').Router();
const ctrl = require('../controllers/UserProgressController');

router.get('/user-progress', ctrl.getProgress);
router.post('/user-progress/select-program', ctrl.selectProgram);
router.post('/user-progress/enroll-course', ctrl.enrollCourse);
router.patch('/user-progress/last-lesson', ctrl.updateLastLesson);

module.exports = router;
