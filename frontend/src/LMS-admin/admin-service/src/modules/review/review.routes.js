const router = require('express').Router();
const c = require('./review.controller');

/**
 * Course/instructor/bootcamp reviews + like/dislike
 * Laravel source: ReviewController
 *
 * TODO: port Laravel route definitions from routes/web.php / routes/api.php.
 * Mount under /api/review from src/modules/index.js.
 */
router.get('/', c.index);
router.get('/:id', c.show);

module.exports = router;
