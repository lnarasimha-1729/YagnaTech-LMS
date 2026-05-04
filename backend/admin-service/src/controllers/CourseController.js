const courseService = require('../services/CourseService');
const { asyncHandler } = require('../middlewares/error');

exports.index = asyncHandler(async (req, res) => {
    res.json(await courseService.list(req.query));
});

exports.create = asyncHandler(async (_req, res) => {
    res.json(await courseService.createMeta());
});

exports.store = asyncHandler(async (req, res) => {
    res.json(await courseService.create({ body: req.body, files: req.files, userId: req.user?.id }));
});

exports.edit = asyncHandler(async (req, res) => {
    res.json(await courseService.edit(req.params.id));
});

exports.update = asyncHandler(async (req, res) => {
    res.json(await courseService.update({ id: req.params.id, body: req.body, files: req.files }));
});

exports.status = asyncHandler(async (req, res) => {
    res.json(await courseService.status(req.params.type, req.params.id));
});

exports.delete = asyncHandler(async (req, res) => {
    res.json(await courseService.remove(req.params.id));
});

exports.draft = asyncHandler(async (req, res) => {
    res.json(await courseService.draft(req.params.id));
});

exports.duplicate = asyncHandler(async (req, res) => {
    res.json(
        await courseService.duplicate({
            id: req.params.id,
            userId: req.user?.id,
            role: req.user?.role,
        })
    );
});

exports.approval = asyncHandler(async (req, res) => {
    res.json(
        await courseService.approval({
            id: req.params.id,
            subject: req.body.subject,
            message: req.body.message,
        })
    );
});
