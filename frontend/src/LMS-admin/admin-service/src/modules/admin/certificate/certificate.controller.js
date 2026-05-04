const service = require('./certificate.service');
const asyncHandler = require('../../../shared/utils/asyncHandler');

/**
 * Admin certificate controller — JSON for the React admin SPA.
 * Handles:
 *   - Coupon-style table CRUD (list/show/store/update/remove/toggleStatus).
 *   - Certificate-module settings flow: settings/template/builder/issue/render
 *     ported from certificate-module/backend/src/controllers/CertificateController.
 */

// ---- Table CRUD ----

exports.list = asyncHandler(async (req, res) => {
  res.json(await service.list(req.query));
});

exports.show = asyncHandler(async (req, res) => {
  res.json(await service.findOne(req.params.id));
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

// ---- Settings / Builder ----

exports.settings = asyncHandler(async (_req, res) => {
  res.json(await service.getCertificateSettings());
});

exports.uploadTemplate = asyncHandler(async (req, res) => {
  // Accept either upload.single('certificate_template') (req.file) or
  // upload.fields(...) shapes from the same module.
  const file = req.file
    || (req.files && req.files.certificate_template && req.files.certificate_template[0])
    || null;
  res.json(await service.uploadTemplate(file));
});

exports.updateBuilder = asyncHandler(async (req, res) => {
  res.json(await service.updateBuilder(req.body.certificate_builder_content));
});

// ---- Issue / Render ----

exports.issue = asyncHandler(async (req, res) => {
  res.json(await service.issue(req.body));
});

exports.render = asyncHandler(async (req, res) => {
  res.json(await service.renderByIdentifier(req.params.identifier));
});
