const service = require('./quiz.service');
const asyncHandler = require('../../shared/utils/asyncHandler');

/**
 * Quizzes, submissions, scoring
 * TODO: mirror the CRUD/custom actions from Instructor/QuizController, Student/QuizController, QuizSubmission.
 */
exports.index = asyncHandler(async (req, res) => {
  res.json(await service.list(req.query));
});

exports.show = asyncHandler(async (req, res) => {
  res.json(await service.findById(req.params.id));
});
