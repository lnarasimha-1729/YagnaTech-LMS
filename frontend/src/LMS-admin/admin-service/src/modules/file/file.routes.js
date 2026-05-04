const router = require('express').Router();
const c = require('./file.controller');

/**
 * Uploads, watermarking, signed media delivery
 * Laravel source: FileController, WatermarkController
 *
 * TODO: port Laravel route definitions from routes/web.php / routes/api.php.
 * Mount under /api/file from src/modules/index.js.
 */
router.get('/', c.index);
router.get('/:id', c.show);

module.exports = router;
