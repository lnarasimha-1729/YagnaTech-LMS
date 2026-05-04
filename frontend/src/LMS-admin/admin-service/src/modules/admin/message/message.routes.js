const router = require('express').Router();
const c = require('./message.controller');
const v = require('./message.validators');
const validate = require('../../../shared/middleware/validate.middleware');

/**
 * Admin message routes.
 * Laravel source: app/Http/Controllers/Admin/MessageController.php
 * Gated by authorize('admin') at the parent /api/admin router.
 */
router.get('/threads/search', c.searchThreads);
router.post('/thread', validate(v.thread_store), c.thread_store);
router.post('/', validate(v.store), c.store);
router.get('/:threadCode?', c.message);

module.exports = router;
