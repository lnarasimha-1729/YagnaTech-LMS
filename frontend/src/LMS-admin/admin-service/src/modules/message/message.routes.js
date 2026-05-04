const router = require('express').Router();
const c = require('./message.controller');

/**
 * User-to-user messaging threads
 * Laravel source: MessageController
 *
 * TODO: port Laravel route definitions from routes/web.php / routes/api.php.
 * Mount under /api/message from src/modules/index.js.
 */
router.get('/', c.index);
router.get('/:id', c.show);

module.exports = router;
