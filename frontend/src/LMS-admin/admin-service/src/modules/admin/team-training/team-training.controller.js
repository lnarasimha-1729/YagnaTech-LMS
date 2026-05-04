const service = require('./team-training.service');
const asyncHandler = require('../../../shared/utils/asyncHandler');

exports.index = asyncHandler(async (req, res) => {
  res.json(await service.list({ user: req.user, query: req.query }));
});

exports.store = asyncHandler(async (req, res) => {
  const row = await service.create({ body: req.body, files: req.files, user: req.user });
  res.status(201).json({ data: row, message: 'Package has been created.' });
});

exports.edit = asyncHandler(async (req, res) => {
  res.json({ data: await service.findById(req.params.id) });
});

exports.update = asyncHandler(async (req, res) => {
  const row = await service.update(req.params.id, {
    body: req.body,
    files: req.files,
    user: req.user,
  });
  res.json({ data: row, message: 'Package has been updated.' });
});

exports.delete = asyncHandler(async (req, res) => {
  const result = await service.remove(req.params.id);
  res.json({ ...result, message: 'Package has been deleted.' });
});

exports.duplicate = asyncHandler(async (req, res) => {
  const row = await service.duplicate(req.params.id, req.user);
  res.json({ data: row, message: 'Package has been copied.' });
});

exports.get_courses = asyncHandler(async (req, res) => {
  res.json({ data: await service.getCourses({ privacy: req.query.privacy }) });
});

exports.get_course_price = asyncHandler(async (req, res) => {
  res.json({ price: await service.getCoursePrice(req.query.course_id) });
});

exports.toggle_status = asyncHandler(async (req, res) => {
  const row = await service.toggleStatus(req.params.id);
  res.json({ data: row, message: 'Status has been updated.' });
});

exports.purchase_history = asyncHandler(async (req, res) => {
  res.json(await service.purchaseHistory(req.query));
});

exports.invoice = asyncHandler(async (req, res) => {
  res.json({ data: await service.invoice(req.params.id, req.user) });
});
