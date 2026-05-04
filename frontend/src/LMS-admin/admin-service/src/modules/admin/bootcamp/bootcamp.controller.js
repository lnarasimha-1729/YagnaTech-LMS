const service = require('./bootcamp.service');
const asyncHandler = require('../../../shared/utils/asyncHandler');

/** Admin bootcamp controller — 1:1 port of Admin/BootcampController.php. */

exports.index = asyncHandler(async (req, res) => {
  res.json(await service.list({ user: req.user, query: req.query }));
});

exports.edit = asyncHandler(async (req, res) => {
  res.json(await service.getEdit(req.params.id, req.user));
});

exports.store = asyncHandler(async (req, res) => {
  const bootcamp = await service.create({ body: req.body, files: req.files, user: req.user });
  res.status(201).json({ data: bootcamp, message: 'Bootcamp has been created.' });
});

exports.update = asyncHandler(async (req, res) => {
  const bootcamp = await service.update(req.params.id, {
    body: req.body,
    files: req.files,
    user: req.user,
  });
  res.json({ data: bootcamp, message: 'Bootcamp has been updated successfully.' });
});

exports.delete = asyncHandler(async (req, res) => {
  await service.remove(req.params.id, req.user);
  res.json({ message: 'Bootcamp has been deleted.' });
});

exports.duplicate = asyncHandler(async (req, res) => {
  const bootcamp = await service.duplicate(req.params.id, req.user);
  res.status(201).json({ data: bootcamp, message: 'Bootcamp has been duplicated.' });
});

exports.status = asyncHandler(async (req, res) => {
  const result = await service.toggleStatus(req.params.id, req.user);
  res.json({ ...result, message: 'Status has been updated.' });
});

exports.purchase_history = asyncHandler(async (req, res) => {
  res.json(await service.purchaseHistory(req.query));
});

exports.invoice = asyncHandler(async (req, res) => {
  res.json({ invoice: await service.invoice(req.params.id) });
});
