const { z } = require('zod');

/**
 * Checkout, gateways, invoices, offline payments, instructor payouts
 * TODO: add Zod schemas mirroring the FormRequest / validate() calls in PaymentController, InvoiceController, PaymentGateway, OfflinePayment, Payout.
 */

const list = z.object({
  page: z.coerce.number().int().positive().optional(),
  per_page: z.coerce.number().int().positive().max(100).optional(),
});

module.exports = { list };
