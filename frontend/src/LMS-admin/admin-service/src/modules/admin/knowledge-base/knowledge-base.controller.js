const service = require('./knowledge-base.service');
const asyncHandler = require('../../../shared/utils/asyncHandler');

/** Admin knowledge-base controller — 1:1 port of Admin/KnowledgeBaseController.php. */

exports.index = asyncHandler(async (req, res) => {
  res.json(await service.list(req.query));
});

exports.store = asyncHandler(async (req, res) => {
  const kb = await service.create(req.body);
  res.status(201).json({ data: kb, message: 'successfullly added' });
});

exports.update = asyncHandler(async (req, res) => {
  const kb = await service.update(req.params.id, req.body);
  res.json({ data: kb, message: 'updated successfully.' });
});

exports.destroy = asyncHandler(async (req, res) => {
  await service.remove(req.params.id);
  res.json({ message: 'successfully deleted.' });
});
