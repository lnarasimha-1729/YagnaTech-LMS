const service = require('./newsletter.service');
const asyncHandler = require('../../shared/utils/asyncHandler');

/**
 * Newsletter composition + subscriber list
 * TODO: mirror the CRUD/custom actions from NewsletterController.
 */
exports.index = asyncHandler(async (req, res) => {
  res.json(await service.list(req.query));
});

exports.show = asyncHandler(async (req, res) => {
  res.json(await service.findById(req.params.id));
});
