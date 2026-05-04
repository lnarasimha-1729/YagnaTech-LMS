const router = require('express').Router();
const c = require('./course.controller');

/**
 * Core course CRUD + curriculum, ratings, filters
 * Laravel source: CourseController, CurriculumController, Instructor/CourseController
 *
 * TODO: port Laravel route definitions from routes/web.php / routes/api.php.
 * Mount under /api/course from src/modules/index.js.
 */
router.get('/', c.index);
router.get('/:id', c.show);

module.exports = router;
