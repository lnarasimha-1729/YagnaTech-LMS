const router = require('express').Router();
const c = require('./knowledge-base.controller');

/**
 * KB categories + topics
 * Laravel source: Admin/KnowledgeBaseController, Frontend/KnowledgeBaseController
 *
 * TODO: port Laravel route definitions from routes/web.php / routes/api.php.
 * Mount under /api/knowledge-base from src/modules/index.js.
 */
router.get('/', c.index);
router.get('/:id', c.show);

module.exports = router;
