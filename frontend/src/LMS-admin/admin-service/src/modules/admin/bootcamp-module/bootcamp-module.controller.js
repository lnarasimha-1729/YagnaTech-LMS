const service = require('./bootcamp-module.service');
const asyncHandler = require('../../../shared/utils/asyncHandler');

exports.store = asyncHandler(async (req, res) => {
  const mod = await service.create({ body: req.body, user: req.user });
  res.status(201).json({ data: mod, message: 'Module has been created.' });
});

exports.update = asyncHandler(async (req, res) => {
  const mod = await service.update(req.params.id, { body: req.body, user: req.user });
  res.json({ data: mod, message: 'Module has been updated.' });
});

exports.delete = asyncHandler(async (req, res) => {
  await service.remove(req.params.id);
  res.json({ message: 'Module has been deleted.' });
});

exports.sort = asyncHandler(async (req, res) => {
  const result = await service.sort(req.body.itemJSON);
  res.json({ status: true, success: 'Modules sorted successfully', ...result });
});
