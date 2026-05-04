const service = require('./bootcamp-category.service');
const asyncHandler = require('../../../shared/utils/asyncHandler');

/** Admin bootcamp-category controller — 1:1 port of Admin/BootcampCategoryController.php. */

exports.index = asyncHandler(async (req, res) => {
  res.json(await service.list(req.query));
});

exports.store = asyncHandler(async (req, res) => {
  const cat = await service.create(req.body);
  res.status(201).json({ data: cat, message: 'Category has been created.' });
});

exports.update = asyncHandler(async (req, res) => {
  const cat = await service.update(req.params.id, req.body);
  res.json({ data: cat, message: 'Category has been updated.' });
});

exports.delete = asyncHandler(async (req, res) => {
  await service.remove(req.params.id);
  res.json({ message: 'Category has been deleted.' });
});
