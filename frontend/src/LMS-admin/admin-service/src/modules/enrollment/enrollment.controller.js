const service = require('./enrollment.service');
const asyncHandler = require('../../shared/utils/asyncHandler');

/**
 * Enrollments, progress, watch history
 * TODO: mirror the CRUD/custom actions from Student/EnrollmentController, Instructor/EnrollmentController.
 */
exports.index = asyncHandler(async (req, res) => {
  res.json(await service.list(req.query));
});

exports.show = asyncHandler(async (req, res) => {
  res.json(await service.findById(req.params.id));
});
