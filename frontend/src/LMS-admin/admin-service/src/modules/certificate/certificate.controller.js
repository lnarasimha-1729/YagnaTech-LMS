const service = require('./certificate.service');
const asyncHandler = require('../../shared/utils/asyncHandler');

/**
 * Certificate controller — mirror of modules/admin/certificate.
 * Same envelope so the React SPA can call either mount with the same client code.
 */

exports.list = asyncHandler(async (req, res) => {
  res.json(await service.list(req.query));
});

exports.show = asyncHandler(async (req, res) => {
  res.json(await service.findById(req.params.id));
});

exports.store = asyncHandler(async (req, res) => {
  const certificate = await service.create({ body: req.body, files: req.files });
  res.status(201).json({
    certificate,
    message: 'Certificate has been created successfully.',
  });
});

exports.update = asyncHandler(async (req, res) => {
  const certificate = await service.update(req.params.id, { body: req.body, files: req.files });
  res.json({
    certificate,
    message: 'Certificate has been updated successfully.',
  });
});

exports.remove = asyncHandler(async (req, res) => {
  await service.remove(req.params.id);
  res.json({ message: 'Certificate deleted successfully' });
});

exports.toggleStatus = asyncHandler(async (req, res) => {
  const certificate = await service.toggleStatus(req.params.id);
  res.json({ certificate, message: 'Status has been updated' });
});

// Backwards-compatibility aliases for the previous stub controller surface.
exports.index = exports.list;
