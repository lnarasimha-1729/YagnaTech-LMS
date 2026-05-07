const router = require('express').Router();
const c = require('./blog.controller');

/**
 * Blog posts, categories, comments, likes
 * Laravel source: BlogController, BlogCategoryController, BlogComment
 *
 * TODO: port Laravel route definitions from routes/web.php / routes/api.php.
 * Mount under /api/blog from src/modules/index.js.
 */
router.get('/', c.index);
router.get('/:id', c.show);

module.exports = router;
