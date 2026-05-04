const service = require('./bootcamp.service');
const asyncHandler = require('../../shared/utils/asyncHandler');

/**
 * Bootcamp programs, modules, live classes, resources, purchases
 * TODO: mirror the CRUD/custom actions from Frontend/BootcampController, Admin/BootcampController, BootcampModule, BootcampLiveClass, BootcampResource.
 */
exports.index = asyncHandler(async (req, res) => {
  res.json(await service.list(req.query));
});

exports.show = asyncHandler(async (req, res) => {
  res.json(await service.findById(req.params.id));
});
