const router = require('express').Router();
const upload = require('../../../shared/middleware/upload.middleware');
const validate = require('../../../shared/middleware/validate.middleware');
const v = require('./bootcamp.validators');
const c = require('./bootcamp.controller');

/**
 * Admin bootcamp routes — Admin/BootcampController.php.
 * Gated by authorize('admin') at the parent /api/admin router.
 * Static paths come before /:id to avoid shadowing.
 */
const multipart = upload.fields([
  { name: 'thumbnail', maxCount: 1 },
  { name: 'og_image', maxCount: 1 },
]);

router.get('/purchase-history', c.purchase_history);
router.get('/', c.index);
router.post('/', multipart, validate(v.store), c.store);

router.get('/:id/edit', c.edit);
router.get('/:id/invoice', c.invoice);
router.post('/:id/duplicate', c.duplicate);
router.patch('/:id/status', c.status);

router.put('/:id', multipart, validate(v.update), c.update);
router.delete('/:id', c.delete);

module.exports = router;
