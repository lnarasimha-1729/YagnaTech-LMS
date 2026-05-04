const liveService = require('../services/LiveClassService');
const { asyncHandler } = require('../middlewares/error');

exports.instructors = asyncHandler(async (_req, res) => {
    res.json(await liveService.instructors());
});

exports.live_classes_by_course = asyncHandler(async (req, res) => {
    res.json(await liveService.listByCourse(req.params.course_id));
});

exports.live_class_store = asyncHandler(async (req, res) => {
    const result = await liveService.create({ course_id: req.params.course_id, body: req.body });
    res.status(201).json(result);
});

exports.live_class_update = asyncHandler(async (req, res) => {
    res.json(await liveService.update({ id: req.params.id, body: req.body }));
});

exports.live_class_delete = asyncHandler(async (req, res) => {
    res.json(await liveService.remove(req.params.id));
});

exports.live_class_start = asyncHandler(async (req, res) => {
    res.json(await liveService.start(req.params.id));
});
