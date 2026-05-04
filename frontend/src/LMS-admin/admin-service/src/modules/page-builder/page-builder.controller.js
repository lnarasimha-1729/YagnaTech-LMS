const service = require('./page-builder.service');
const asyncHandler = require('../../shared/utils/asyncHandler');

/**
 * Dynamic CMS pages
 * TODO: mirror the CRUD/custom actions from Admin/BuilderController.
 */
exports.index = asyncHandler(async (req, res) => {
  res.json(await service.list(req.query));
});

exports.show = asyncHandler(async (req, res) => {
  res.json(await service.findById(req.params.id));
});
