const service = require('./seo.service');
const asyncHandler = require('../../shared/utils/asyncHandler');

/**
 * Per-page SEO fields (title, description, og-image)
 * TODO: mirror the CRUD/custom actions from SeoController.
 */
exports.index = asyncHandler(async (req, res) => {
  res.json(await service.list(req.query));
});

exports.show = asyncHandler(async (req, res) => {
  res.json(await service.findById(req.params.id));
});
