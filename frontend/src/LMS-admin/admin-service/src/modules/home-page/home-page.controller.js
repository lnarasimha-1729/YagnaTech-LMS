const service = require('./home-page.service');
const asyncHandler = require('../../shared/utils/asyncHandler');

/**
 * Homepage content blocks + settings
 * TODO: mirror the CRUD/custom actions from Frontend/HomeController, Admin/HomePageSettingController.
 */
exports.index = asyncHandler(async (req, res) => {
  res.json(await service.list(req.query));
});

exports.show = asyncHandler(async (req, res) => {
  res.json(await service.findById(req.params.id));
});
