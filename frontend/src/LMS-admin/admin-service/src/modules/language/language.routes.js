const router = require('express').Router();
const c = require('./language.controller');

/**
 * Multi-language support, phrase translations
 * Laravel source: LanguageController
 *
 * TODO: port Laravel route definitions from routes/web.php / routes/api.php.
 * Mount under /api/language from src/modules/index.js.
 */
router.get('/', c.index);
router.get('/:id', c.show);

module.exports = router;
