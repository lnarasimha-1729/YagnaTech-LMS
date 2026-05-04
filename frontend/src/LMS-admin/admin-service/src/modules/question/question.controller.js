const service = require('./question.service');
const asyncHandler = require('../../shared/utils/asyncHandler');

/**
 * Quiz questions CRUD
 * TODO: mirror the CRUD/custom actions from Instructor/QuestionController.
 */
exports.index = asyncHandler(async (req, res) => {
  res.json(await service.list(req.query));
});

exports.show = asyncHandler(async (req, res) => {
  res.json(await service.findById(req.params.id));
});
