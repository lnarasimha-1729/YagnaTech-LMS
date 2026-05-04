const service = require('./user.service');
const asyncHandler = require('../../shared/utils/asyncHandler');

/**
 * User CRUD + profile updates + role changes
 * TODO: mirror the CRUD/custom actions from UsersController, Instructor/ProfileController, Student/ProfileController.
 */
exports.index = asyncHandler(async (req, res) => {
  res.json(await service.list(req.query));
});

exports.show = asyncHandler(async (req, res) => {
  res.json(await service.findById(req.params.id));
});
