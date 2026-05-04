const studentService = require('../services/StudentService');
const { asyncHandler } = require('../middlewares/error');

exports.index = asyncHandler(async (req, res) => {
    res.json(await studentService.list(req.query));
});

exports.show = asyncHandler(async (req, res) => {
    res.json(await studentService.get(req.params.id));
});

exports.store = asyncHandler(async (req, res) => {
    res.status(201).json(await studentService.create(req.body, req.file));
});

exports.update = asyncHandler(async (req, res) => {
    res.json(await studentService.update(req.params.id, req.body, req.file));
});

exports.destroy = asyncHandler(async (req, res) => {
    res.json(await studentService.remove(req.params.id));
});
