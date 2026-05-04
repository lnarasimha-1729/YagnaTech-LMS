const router = require('express').Router();
const upload = require('../../../shared/middleware/upload.middleware');
const validate = require('../../../shared/middleware/validate.middleware');
const v = require('./category.validators');
const c = require('./category.controller');

/**
 * Admin category routes — gated by authorize('admin') at the parent /api/admin router.
 * Laravel source: app/Http/Controllers/Admin/CategoryController.php
 * Accepts multipart/form-data because store/update handle thumbnail + category_logo.
 */
const multipart = upload.fields([
  { name: 'thumbnail', maxCount: 1 },
  { name: 'category_logo', maxCount: 1 },
]);

router.get('/', c.index);
router.post('/', multipart, validate(v.store), c.store);
router.put('/:id', multipart, validate(v.update), c.update);
router.delete('/:id', c.delete);

module.exports = router;
