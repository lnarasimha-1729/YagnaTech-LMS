const service = require('./offline-payment.service');
const asyncHandler = require('../../../shared/utils/asyncHandler');

exports.index = asyncHandler(async (req, res) => {
  const result = await service.list(req.query);
  res.json(result);
});

exports.download_doc = asyncHandler(async (req, res) => {
  const { absPath, filename } = await service.downloadDoc(req.params.id);
  res.download(absPath, filename);
});

exports.accept_payment = asyncHandler(async (req, res) => {
  const result = await service.acceptPayment(req.params.id);
  res.json({ ...result, message: 'Payment has been accepted.' });
});

exports.decline_payment = asyncHandler(async (req, res) => {
  const result = await service.declinePayment(req.params.id);
  res.json({ ...result, message: 'Payment has been suspended' });
});

exports.delete_payment = asyncHandler(async (req, res) => {
  const result = await service.deletePayment(req.params.id);
  res.json({ ...result, message: 'Admin revenue delete successfully' });
});
