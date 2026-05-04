const service = require('./openai.service');
const asyncHandler = require('../../../shared/utils/asyncHandler');

exports.settings = asyncHandler(async (_req, res) => {
  res.json({ data: await service.listSettings() });
});

exports.settings_update = asyncHandler(async (req, res) => {
  const result = await service.updateSettings(req.body);
  res.json({ ...result, message: 'Open ai settings changed successfully' });
});

exports.generate = asyncHandler(async (req, res) => {
  const result = await service.generate({ body: req.body });
  res.json({ result });
});
