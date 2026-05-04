const service = require('./bootcamp-live-class.service');
const asyncHandler = require('../../../shared/utils/asyncHandler');

/** Admin bootcamp-live-class controller — 1:1 port of Admin/BootcampLiveClassController.php. */

exports.store = asyncHandler(async (req, res) => {
  const row = await service.create({ body: req.body, user: req.user });
  res.status(201).json({ data: row, message: 'Live class has been created.' });
});

exports.update = asyncHandler(async (req, res) => {
  const row = await service.update(req.params.id, { body: req.body, user: req.user });
  res.json({ data: row, message: 'Live class has been updated.' });
});

exports.delete = asyncHandler(async (req, res) => {
  const result = await service.remove(req.params.id, req.user);
  res.json({ ...result, message: 'Live class has been deleted.' });
});

exports.join_class = asyncHandler(async (req, res) => {
  const result = await service.join(req.params.slug, req.user);
  res.json(result);
});

exports.stop_class = asyncHandler(async (req, res) => {
  const result = await service.stop(req.params.id, req.user);
  res.json({ ...result, message: 'Class has been ended.' });
});

exports.sort = asyncHandler(async (req, res) => {
  const result = await service.sort(req.body.itemJSON);
  res.json({ status: true, success: 'Classes sorted successfully', ...result });
});
