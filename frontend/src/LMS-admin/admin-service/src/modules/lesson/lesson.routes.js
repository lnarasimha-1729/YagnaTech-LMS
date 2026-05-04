const router = require('express').Router();
const c = require('./lesson.controller');

/**
 * Lessons within sections (video, text, attachment)
 * Laravel source: Instructor/LessonController, CurriculumController
 *
 * TODO: port Laravel route definitions from routes/web.php / routes/api.php.
 * Mount under /api/lesson from src/modules/index.js.
 */
router.get('/', c.index);
router.get('/:id', c.show);

module.exports = router;
