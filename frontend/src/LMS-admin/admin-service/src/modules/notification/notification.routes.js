const router = require('express').Router();
const c = require('./notification.controller');

/**
 * In-app notifications + settings
 * Laravel source: NotificationController
 *
 * TODO: port Laravel route definitions from routes/web.php / routes/api.php.
 * Mount under /api/notification from src/modules/index.js.
 */
router.get('/', c.index);
router.get('/:id', c.show);

module.exports = router;
