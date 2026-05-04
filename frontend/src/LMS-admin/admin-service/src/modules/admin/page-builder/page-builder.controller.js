const service = require('./page-builder.service');
const asyncHandler = require('../../../shared/utils/asyncHandler');

exports.page_list = asyncHandler(async (_req, res) => {
  res.json(await service.list());
});

exports.page_store = asyncHandler(async (req, res) => {
  const row = await service.create({ body: req.body });
  res.status(201).json({ data: row, message: 'New home page layout has been added' });
});

exports.page_update = asyncHandler(async (req, res) => {
  const row = await service.update(req.params.id, { body: req.body });
  res.json({ data: row, message: 'Home page name has been updated' });
});

exports.page_delete = asyncHandler(async (req, res) => {
  const result = await service.remove(req.params.id);
  res.json({ ...result, message: 'The page has been deleted' });
});

exports.page_status = asyncHandler(async (req, res) => {
  res.json(await service.toggleStatus(req.params.id));
});

exports.page_layout_edit = asyncHandler(async (req, res) => {
  res.json(await service.layoutEdit(req.params.id));
});

exports.page_layout_update = asyncHandler(async (req, res) => {
  const result = await service.layoutUpdate(req.params.id, { body: req.body });
  res.json({ ...result, message: 'Page layout has been updated' });
});

exports.page_layout_image_update = asyncHandler(async (req, res) => {
  const result = await service.layoutImageUpdate({ file: req.file, body: req.body });
  res.json(result);
});

exports.preview = asyncHandler(async (req, res) => {
  res.json(await service.preview(req.params.id));
});

exports.developer_file_content = asyncHandler(async (_req, res) => {
  res.json({ content: '' });
});
