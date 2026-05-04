const service = require('./course.service');
const asyncHandler = require('../../shared/utils/asyncHandler');

/**
 * Core course CRUD + curriculum, ratings, filters
 * TODO: mirror the CRUD/custom actions from CourseController, CurriculumController, Instructor/CourseController.
 */
exports.index = asyncHandler(async (req, res) => {
  res.json(await service.list(req.query));
});

exports.show = asyncHandler(async (req, res) => {
  res.json(await service.findById(req.params.id));
});
