const router = require('express').Router();
const c = require('./page-builder.controller');

/**
 * Dynamic CMS pages
 * Laravel source: Admin/BuilderController
 *
 * TODO: port Laravel route definitions from routes/web.php / routes/api.php.
 * Mount under /api/page-builder from src/modules/index.js.
 */
router.get('/', c.index);
router.get('/:id', c.show);

module.exports = router;
