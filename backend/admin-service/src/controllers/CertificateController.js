const certificateService = require('../services/CertificateService');
const { asyncHandler } = require('../middlewares/error');

// ---- Coupon-style table CRUD ----

exports.index = asyncHandler(async (req, res) => {
    const { page, search } = req.query;
    res.json(await certificateService.list({ page, search }));
});

exports.show = asyncHandler(async (req, res) => {
    res.json(await certificateService.get({ id: req.params.id }));
});

exports.store = asyncHandler(async (req, res) => {
    res.json(await certificateService.create({ body: req.body, file: req.file }));
});

exports.update = asyncHandler(async (req, res) => {
    res.json(await certificateService.update({ id: req.params.id, body: req.body, file: req.file }));
});

exports.delete = asyncHandler(async (req, res) => {
    res.json(await certificateService.remove({ id: req.params.id }));
});

exports.status = asyncHandler(async (req, res) => {
    res.json(await certificateService.toggleStatus({ id: req.params.id }));
});

// ---- Settings / Builder ----

exports.settings = asyncHandler(async (_req, res) => {
    res.json(await certificateService.getSettings());
});

exports.uploadTemplate = asyncHandler(async (req, res) => {
    res.json(await certificateService.uploadTemplate({ file: req.file }));
});

exports.updateBuilder = asyncHandler(async (req, res) => {
    res.json(await certificateService.updateBuilder(req.body));
});

// ---- Issue / Render ----

exports.issue = asyncHandler(async (req, res) => {
    res.json(await certificateService.issue(req.body));
});

exports.render = asyncHandler(async (req, res) => {
    res.json(await certificateService.renderByIdentifier({ identifier: req.params.identifier }));
});

// ---- Public student-side endpoints (no admin token, x-user-id header) ----

// Auth-service issues string userIds (e.g. "usr_abc123"); preserve them verbatim.
// Numbers are also valid (legacy/test data) so we accept either shape.
const getStudentId = (req) => {
    const raw = req.headers['x-user-id'] || req.query.user_id;
    if (raw === undefined || raw === null) return null;
    const trimmed = String(raw).trim();
    return trimmed.length ? trimmed : null;
};

exports.studentFind = asyncHandler(async (req, res) => {
    const user_id = getStudentId(req);
    const course_id = Number(req.query.course_id);
    if (!user_id || !course_id) return res.json({ certificate: null });
    const cert = await certificateService.findForUserAndCourse({ user_id, course_id });
    res.json({ certificate: cert });
});

exports.studentIssue = asyncHandler(async (req, res) => {
    const user_id = getStudentId(req);
    const course_id = Number(req.body?.course_id);
    const progress = Number(req.body?.progress);
    res.json(await certificateService.issue({ user_id, course_id, progress }));
});

exports.studentList = asyncHandler(async (req, res) => {
    const user_id = getStudentId(req);
    if (!user_id) return res.json({ certificates: [] });
    res.json(await certificateService.listForUser({ user_id }));
});
