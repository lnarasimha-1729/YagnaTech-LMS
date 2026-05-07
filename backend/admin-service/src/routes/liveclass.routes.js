const router = require('express').Router();
const ctrl = require('../controllers/LiveClassController');

router.get('/instructors', ctrl.instructors);

router.get('/course/:course_id/live-classes', ctrl.live_classes_by_course);
router.post('/course/:course_id/live-class', ctrl.live_class_store);
router.post('/live-class/:id', ctrl.live_class_update);
router.delete('/live-class/:id', ctrl.live_class_delete);
router.get('/live-class/:id/start', ctrl.live_class_start);

module.exports = router;
