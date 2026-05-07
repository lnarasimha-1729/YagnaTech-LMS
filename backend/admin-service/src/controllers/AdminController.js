const adminService = require('../services/AdminService');
const { asyncHandler } = require('../middlewares/error');

exports.index = asyncHandler(async (req, res) => {
    res.json(await adminService.list(req.query));
});

exports.show = asyncHandler(async (req, res) => {
    res.json(await adminService.get(req.params.id));
});

exports.store = asyncHandler(async (req, res) => {
    res.status(201).json(await adminService.create(req.body, req.file));
});

exports.update = asyncHandler(async (req, res) => {
    res.json(await adminService.update(req.params.id, req.body, req.file));
});

exports.destroy = asyncHandler(async (req, res) => {
    res.json(await adminService.remove(req.params.id));
});
