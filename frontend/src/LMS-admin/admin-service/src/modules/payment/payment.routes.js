const router = require('express').Router();
const c = require('./payment.controller');

/**
 * Checkout, gateways, invoices, offline payments, instructor payouts
 * Laravel source: PaymentController, InvoiceController, PaymentGateway, OfflinePayment, Payout
 *
 * TODO: port Laravel route definitions from routes/web.php / routes/api.php.
 * Mount under /api/payment from src/modules/index.js.
 */
router.get('/', c.index);
router.get('/:id', c.show);

module.exports = router;
