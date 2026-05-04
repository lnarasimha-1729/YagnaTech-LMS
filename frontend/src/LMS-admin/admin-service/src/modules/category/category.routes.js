const router = require('express').Router();
const c = require('./category.controller');

/**
 * Course taxonomy CRUD
 * Laravel source: Admin/CategoryController
 *
 * TODO: port Laravel route definitions from routes/web.php / routes/api.php.
 * Mount under /api/category from src/modules/index.js.
 */
router.get('/', c.index);
router.get('/:id', c.show);

module.exports = router;
