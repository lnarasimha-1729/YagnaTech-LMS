const service = require('./lesson.service');
const asyncHandler = require('../../shared/utils/asyncHandler');

/**
 * Lessons within sections (video, text, attachment)
 * TODO: mirror the CRUD/custom actions from Instructor/LessonController, CurriculumController.
 */
exports.index = asyncHandler(async (req, res) => {
  res.json(await service.list(req.query));
});

exports.show = asyncHandler(async (req, res) => {
  res.json(await service.findById(req.params.id));
});
