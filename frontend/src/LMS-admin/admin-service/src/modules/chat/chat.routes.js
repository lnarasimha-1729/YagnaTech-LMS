const router = require('express').Router();
const c = require('./chat.controller');

/**
 * Realtime chat / DMs (may need websocket layer)
 * Laravel source: ChatController
 *
 * TODO: port Laravel route definitions from routes/web.php / routes/api.php.
 * Mount under /api/chat from src/modules/index.js.
 */
router.get('/', c.index);
router.get('/:id', c.show);

module.exports = router;
