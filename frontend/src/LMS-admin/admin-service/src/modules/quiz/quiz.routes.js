const router = require('express').Router();
const c = require('./quiz.controller');

/**
 * Quizzes, submissions, scoring
 * Laravel source: Instructor/QuizController, Student/QuizController, QuizSubmission
 *
 * TODO: port Laravel route definitions from routes/web.php / routes/api.php.
 * Mount under /api/quiz from src/modules/index.js.
 */
router.get('/', c.index);
router.get('/:id', c.show);

module.exports = router;
