const router = require('express').Router();
const c = require('./team-training.controller');
const v = require('./team-training.validators');
const validate = require('../../../shared/middleware/validate.middleware');
const upload = require('../../../shared/middleware/upload.middleware');

/**
 * Admin team-training routes.
 * Laravel source: app/Http/Controllers/Admin/TeamTrainingController.php
 * Gated by authorize('admin') at the parent /api/admin router.
 */
router.get('/courses', c.get_courses);
router.get('/course-price', c.get_course_price);
router.get('/purchase-history', c.purchase_history);
router.get('/', c.index);
router.post('/', upload.fields([{ name: 'thumbnail', maxCount: 1 }]), validate(v.store), c.store);
router.get('/:id/edit', c.edit);
router.put(
  '/:id',
  upload.fields([{ name: 'thumbnail', maxCount: 1 }]),
  validate(v.update),
  c.update
);
router.delete('/:id', c.delete);
router.post('/:id/duplicate', c.duplicate);
router.patch('/:id/toggle-status', c.toggle_status);
router.get('/:id/invoice', c.invoice);

module.exports = router;
