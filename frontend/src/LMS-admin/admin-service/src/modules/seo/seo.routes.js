const router = require('express').Router();
const c = require('./seo.controller');

/**
 * Per-page SEO fields (title, description, og-image)
 * Laravel source: SeoController
 *
 * TODO: port Laravel route definitions from routes/web.php / routes/api.php.
 * Mount under /api/seo from src/modules/index.js.
 */
router.get('/', c.index);
router.get('/:id', c.show);

module.exports = router;
