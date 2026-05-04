const router = require('express').Router();
const c = require('./live-class.controller');

/**
 * Scheduled live classes (Zoom/meeting providers)
 * Laravel source: LiveClassController, ZoomMeetingController
 *
 * TODO: port Laravel route definitions from routes/web.php / routes/api.php.
 * Mount under /api/live-class from src/modules/index.js.
 */
router.get('/', c.index);
router.get('/:id', c.show);

module.exports = router;
