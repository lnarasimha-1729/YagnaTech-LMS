const service = require('./question.service');
const asyncHandler = require('../../../shared/utils/asyncHandler');

/** Admin question controller — 1:1 port of Admin/QuestionController.php. */

exports.store = asyncHandler(async (req, res) => {
  const q = await service.create(req.body);
  res.status(201).json({
    status: true,
    success: 'Question has been added.',
    data: q,
  });
});

exports.update = asyncHandler(async (req, res) => {
  const q = await service.update(req.params.id, req.body);
  res.json({
    status: true,
    success: 'Question has been updated.',
    data: q,
  });
});

exports.delete = asyncHandler(async (req, res) => {
  await service.remove(req.params.id);
  res.json({ status: true, success: 'Question has been deleted.' });
});

exports.sort = asyncHandler(async (req, res) => {
  const result = await service.sort(req.body.itemJSON);
  res.json({ status: true, success: 'Questions has been sorted.', ...result });
});

/**
 * Laravel's load_type returned a view fragment; in the SPA we return the
 * question payload + resolved type/action so the client can pick the form.
 */
exports.load_type = asyncHandler(async (req, res) => {
  const { type, id } = req.query;
  const types = ['mcq', 'fill_blanks', 'true_false'];
  if (!types.includes(type)) {
    return res.status(422).json({ status: false, error: 'Unsupported question type.' });
  }
  const action = id ? 'edit' : 'create';
  const question = id ? await service.findForLoadType(id) : null;
  res.json({ status: true, type, action, question });
});
