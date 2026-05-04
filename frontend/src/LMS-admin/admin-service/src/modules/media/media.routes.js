const router = require('express').Router();
const c = require('./media.controller');

/**
 * Media library — uploads, browsing, deletion
 * Laravel source: FileController, MediaFile
 *
 * TODO: port Laravel route definitions from routes/web.php / routes/api.php.
 * Mount under /api/media from src/modules/index.js.
 */
router.get('/', c.index);
router.get('/:id', c.show);

module.exports = router;
