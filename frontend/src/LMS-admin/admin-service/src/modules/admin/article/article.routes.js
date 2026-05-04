const router = require('express').Router();
const validate = require('../../../shared/middleware/validate.middleware');
const v = require('./article.validators');
const c = require('./article.controller');

/**
 * Admin article routes — Admin/ArticleController.php.
 * Gated by authorize('admin') at the parent /api/admin router.
 * Laravel's index/create were empty; we omit them here.
 *   GET  /:id           → list articles under KnowledgeBase :id (show)
 *   GET  /:id/edit      → return parent KB for edit form
 *   POST /              → create article
 *   PUT  /:id           → update article
 *   DELETE /:id         → delete article
 */
router.post('/', validate(v.store), c.store);
router.get('/:id', c.show);
router.get('/:id/edit', c.edit);
router.put('/:id', validate(v.update), c.update);
router.delete('/:id', c.destroy);

module.exports = router;
