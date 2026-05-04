const router = require('express').Router();
const c = require('./forum.controller');

/**
 * Course Q&A / forum threads + replies
 * Laravel source: ForumController
 *
 * TODO: port Laravel route definitions from routes/web.php / routes/api.php.
 * Mount under /api/forum from src/modules/index.js.
 */
router.get('/', c.index);
router.get('/:id', c.show);

module.exports = router;
