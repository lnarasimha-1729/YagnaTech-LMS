const router = require('express').Router();
const c = require('./enrollment.controller');

/**
 * Enrollments, progress, watch history
 * Laravel source: Student/EnrollmentController, Instructor/EnrollmentController
 *
 * TODO: port Laravel route definitions from routes/web.php / routes/api.php.
 * Mount under /api/enrollment from src/modules/index.js.
 */
router.get('/', c.index);
router.get('/:id', c.show);

module.exports = router;
