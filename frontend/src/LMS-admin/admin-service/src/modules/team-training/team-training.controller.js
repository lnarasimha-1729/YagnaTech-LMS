const service = require('./team-training.service');
const asyncHandler = require('../../shared/utils/asyncHandler');

/**
 * Team training packages, purchases, member invites
 * TODO: mirror the CRUD/custom actions from TeamTrainingController, TeamPackagePurchase, TeamPackageMember.
 */
exports.index = asyncHandler(async (req, res) => {
  res.json(await service.list(req.query));
});

exports.show = asyncHandler(async (req, res) => {
  res.json(await service.findById(req.params.id));
});
