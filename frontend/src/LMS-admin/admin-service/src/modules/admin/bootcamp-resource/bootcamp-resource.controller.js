const service = require('./bootcamp-resource.service');
const asyncHandler = require('../../../shared/utils/asyncHandler');

/** ucfirst helper — matches Laravel's ucfirst($upload_type) in flash messages. */
const ucfirst = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

exports.store = asyncHandler(async (req, res) => {
  const result = await service.create({ body: req.body, files: req.files, user: req.user });
  res.status(201).json({
    data: result.data,
    message: `${ucfirst(result.upload_type)} has been uploaded.`,
  });
});

exports.delete = asyncHandler(async (req, res) => {
  const result = await service.remove(req.params.id);
  res.json({ message: `${ucfirst(result.upload_type)} has been deleted.` });
});

exports.download = asyncHandler(async (req, res) => {
  const { absPath, filename } = await service.download(req.params.id);
  res.download(absPath, filename);
});
