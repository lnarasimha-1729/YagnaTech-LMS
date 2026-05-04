const service = require('./tutor-booking.service');
const asyncHandler = require('../../../shared/utils/asyncHandler');

exports.subjects = asyncHandler(async (req, res) => {
  res.json(await service.listSubjects(req.query));
});

exports.tutor_subject_store = asyncHandler(async (req, res) => {
  const row = await service.createSubject({ body: req.body });
  res.status(201).json({ data: row, message: 'Subject added successfully' });
});

exports.tutor_subject_update = asyncHandler(async (req, res) => {
  const row = await service.updateSubject(req.params.id, { body: req.body });
  res.json({ data: row, message: 'Subject updated successfully' });
});

exports.tutor_subject_status = asyncHandler(async (req, res) => {
  const row = await service.setSubjectStatus(req.params.id, req.params.status);
  res.json({ data: row, message: 'Subject status updated successfully' });
});

exports.tutor_subject_delete = asyncHandler(async (req, res) => {
  const result = await service.deleteSubject(req.params.id);
  res.json({ ...result, message: 'Subject deleted successfully' });
});

exports.tutor_categories = asyncHandler(async (req, res) => {
  res.json(await service.listCategories(req.query));
});

exports.tutor_category_store = asyncHandler(async (req, res) => {
  const row = await service.createCategory({ body: req.body });
  res.status(201).json({ data: row, message: 'Subject category added successfully' });
});

exports.tutor_category_update = asyncHandler(async (req, res) => {
  const row = await service.updateCategory(req.params.id, { body: req.body });
  res.json({ data: row, message: 'Category updated successfully' });
});

exports.tutor_category_status = asyncHandler(async (req, res) => {
  const row = await service.setCategoryStatus(req.params.id, req.params.status);
  res.json({ data: row, message: 'Category status updated successfully' });
});

exports.tutor_category_delete = asyncHandler(async (req, res) => {
  const result = await service.deleteCategory(req.params.id);
  res.json({ ...result, message: 'Subject category deleted successfully' });
});
