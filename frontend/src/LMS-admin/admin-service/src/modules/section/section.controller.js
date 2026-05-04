const service = require('./section.service');
const asyncHandler = require('../../shared/utils/asyncHandler');

/**
 * Course sections ordering + CRUD
 * TODO: mirror the CRUD/custom actions from Instructor/SectionController, CurriculumController.
 */
exports.index = asyncHandler(async (req, res) => {
  res.json(await service.list(req.query));
});

exports.show = asyncHandler(async (req, res) => {
  res.json(await service.findById(req.params.id));
});
