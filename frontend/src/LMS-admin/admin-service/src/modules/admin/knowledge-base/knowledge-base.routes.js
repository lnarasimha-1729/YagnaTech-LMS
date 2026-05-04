const router = require('express').Router();
const validate = require('../../../shared/middleware/validate.middleware');
const v = require('./knowledge-base.validators');
const c = require('./knowledge-base.controller');

/**
 * Admin knowledge-base routes — Admin/KnowledgeBaseController.php.
 * Gated by authorize('admin') at the parent /api/admin router.
 */
router.get('/', c.index);
router.post('/', validate(v.store), c.store);
router.put('/:id', validate(v.update), c.update);
router.delete('/:id', c.destroy);

module.exports = router;
