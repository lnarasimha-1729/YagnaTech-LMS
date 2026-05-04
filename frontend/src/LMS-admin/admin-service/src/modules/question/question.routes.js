const router = require('express').Router();
const c = require('./question.controller');

/**
 * Quiz questions CRUD
 * Laravel source: Instructor/QuestionController
 *
 * TODO: port Laravel route definitions from routes/web.php / routes/api.php.
 * Mount under /api/question from src/modules/index.js.
 */
router.get('/', c.index);
router.get('/:id', c.show);

module.exports = router;
