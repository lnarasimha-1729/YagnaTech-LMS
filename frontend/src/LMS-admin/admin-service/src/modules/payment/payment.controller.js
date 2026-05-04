const service = require('./payment.service');
const asyncHandler = require('../../shared/utils/asyncHandler');

/**
 * Checkout, gateways, invoices, offline payments, instructor payouts
 * TODO: mirror the CRUD/custom actions from PaymentController, InvoiceController, PaymentGateway, OfflinePayment, Payout.
 */
exports.index = asyncHandler(async (req, res) => {
  res.json(await service.list(req.query));
});

exports.show = asyncHandler(async (req, res) => {
  res.json(await service.findById(req.params.id));
});
