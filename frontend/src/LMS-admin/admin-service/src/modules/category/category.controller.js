const service = require('./category.service');
const asyncHandler = require('../../shared/utils/asyncHandler');

/**
 * Course taxonomy CRUD
 * TODO: mirror the CRUD/custom actions from Admin/CategoryController.
 */
exports.index = asyncHandler(async (req, res) => {
  res.json(await service.list(req.query));
});

exports.show = asyncHandler(async (req, res) => {
  res.json(await service.findById(req.params.id));
});
