const router = require('express').Router();
const c = require('./offline-payment.controller');

/**
 * Admin offline-payment routes.
 * Laravel source: app/Http/Controllers/Admin/OfflinePaymentController.php
 * Gated by authorize('admin') at the parent /api/admin router.
 */
router.get('/', c.index);
router.get('/:id/document', c.download_doc);
router.post('/:id/accept', c.accept_payment);
router.post('/:id/decline', c.decline_payment);
router.delete('/:id', c.delete_payment);

module.exports = router;
