const service = require('./dashboard.service');
const asyncHandler = require('../../shared/utils/asyncHandler');

/**
 * Role-specific dashboard aggregations
 * TODO: mirror the CRUD/custom actions from DashboardController, Admin/DashboardController, Instructor/DashboardController, Student/DashboardController.
 */
exports.index = asyncHandler(async (req, res) => {
  res.json(await service.list(req.query));
});

exports.show = asyncHandler(async (req, res) => {
  res.json(await service.findById(req.params.id));
});
