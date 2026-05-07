const router = require('express').Router();
const c = require('./tutor-booking.controller');
const v = require('./tutor-booking.validators');
const validate = require('../../../shared/middleware/validate.middleware');

/**
 * Admin tutor-booking routes.
 * Laravel source: app/Http/Controllers/Admin/TutorBookingController.php
 * Gated by authorize('admin') at the parent /api/admin router.
 */
router.get('/subjects', c.subjects);
router.post('/subjects', validate(v.subject_store), c.tutor_subject_store);
router.put('/subjects/:id', validate(v.subject_update), c.tutor_subject_update);
router.patch('/subjects/:id/status/:status', c.tutor_subject_status);
router.delete('/subjects/:id', c.tutor_subject_delete);
router.get('/categories', c.tutor_categories);
router.post('/categories', validate(v.category_store), c.tutor_category_store);
router.put('/categories/:id', validate(v.category_update), c.tutor_category_update);
router.patch('/categories/:id/status/:status', c.tutor_category_status);
router.delete('/categories/:id', c.tutor_category_delete);

module.exports = router;
