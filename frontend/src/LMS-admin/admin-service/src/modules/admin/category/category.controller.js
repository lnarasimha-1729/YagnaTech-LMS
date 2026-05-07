const service = require('./category.service');
const asyncHandler = require('../../../shared/utils/asyncHandler');

/**
 * Admin category controller — 1:1 port of Admin/CategoryController.php.
 * Laravel returns redirects with flash messages; we return JSON for the React SPA.
 */

exports.index = asyncHandler(async (_req, res) => {
  res.json({ data: await service.list() });
});

exports.store = asyncHandler(async (req, res) => {
  const category = await service.create({ body: req.body, files: req.files });
  res.status(201).json({
    data: category,
    message: 'Category added successfully',
  });
});

exports.update = asyncHandler(async (req, res) => {
  const category = await service.update(req.params.id, { body: req.body, files: req.files });
  res.json({
    data: category,
    message: 'Category updated successfully',
  });
});

exports.delete = asyncHandler(async (req, res) => {
  await service.remove(req.params.id);
  res.json({ message: 'Category deleted successfully' });
});
