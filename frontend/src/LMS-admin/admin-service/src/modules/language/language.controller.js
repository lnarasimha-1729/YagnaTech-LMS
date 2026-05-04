const service = require('./language.service');
const asyncHandler = require('../../shared/utils/asyncHandler');

/**
 * Multi-language support, phrase translations
 * TODO: mirror the CRUD/custom actions from LanguageController.
 */
exports.index = asyncHandler(async (req, res) => {
  res.json(await service.list(req.query));
});

exports.show = asyncHandler(async (req, res) => {
  res.json(await service.findById(req.params.id));
});
