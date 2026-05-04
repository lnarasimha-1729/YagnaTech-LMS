const service = require('./settings.service');
const asyncHandler = require('../../shared/utils/asyncHandler');

exports.frontend = asyncHandler(async (_req, res) => {
  res.json({ data: await service.frontendMap() });
});

exports.global = asyncHandler(async (_req, res) => {
  res.json({ data: await service.globalMap() });
});
