const router = require('express').Router();
const c = require('./home-page.controller');

/**
 * Homepage content blocks + settings
 * Laravel source: Frontend/HomeController, Admin/HomePageSettingController
 *
 * TODO: port Laravel route definitions from routes/web.php / routes/api.php.
 * Mount under /api/home-page from src/modules/index.js.
 */
router.get('/', c.index);
router.get('/:id', c.show);

module.exports = router;
