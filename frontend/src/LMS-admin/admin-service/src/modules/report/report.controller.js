const service = require('./report.service');
const asyncHandler = require('../../shared/utils/asyncHandler');

/**
 * Sales/enrollment/earnings reports + CSV export
 * TODO: mirror the CRUD/custom actions from ReportController.
 */
exports.index = asyncHandler(async (req, res) => {
  res.json(await service.list(req.query));
});

exports.show = asyncHandler(async (req, res) => {
  res.json(await service.findById(req.params.id));
});
