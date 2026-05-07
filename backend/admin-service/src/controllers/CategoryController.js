const categoryService = require('../services/CategoryService');
const { asyncHandler } = require('../middlewares/error');

exports.index = asyncHandler(async (_req, res) => {
    res.json(await categoryService.list());
});

exports.store = asyncHandler(async (req, res) => {
    res.json(await categoryService.create(req.body, req.files));
});

exports.update = asyncHandler(async (req, res) => {
    res.json(await categoryService.update(req.params.id, req.body, req.files));
});

exports.delete = asyncHandler(async (req, res) => {
    res.json(await categoryService.remove(req.params.id));
});
