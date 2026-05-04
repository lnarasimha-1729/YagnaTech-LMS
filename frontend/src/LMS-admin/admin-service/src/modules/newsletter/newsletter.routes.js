const router = require('express').Router();
const c = require('./newsletter.controller');

/**
 * Newsletter composition + subscriber list
 * Laravel source: NewsletterController
 *
 * TODO: port Laravel route definitions from routes/web.php / routes/api.php.
 * Mount under /api/newsletter from src/modules/index.js.
 */
router.get('/', c.index);
router.get('/:id', c.show);

module.exports = router;
