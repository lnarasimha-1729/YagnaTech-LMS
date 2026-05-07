const router = require('express').Router();
const c = require('./bootcamp-live-class.controller');
const v = require('./bootcamp-live-class.validators');
const validate = require('../../../shared/middleware/validate.middleware');

/**
 * Admin bootcamp-live-class routes.
 * Laravel source: app/Http/Controllers/Admin/BootcampLiveClassController.php
 * Gated by authorize('admin') at the parent /api/admin router.
 */
router.post('/', validate(v.store), c.store);
router.put('/:id', validate(v.update), c.update);
router.delete('/:id', c.delete);
router.get('/:slug/join', c.join_class);
router.post('/:id/stop', c.stop_class);
router.post('/sort', validate(v.sort), c.sort);

module.exports = router;
