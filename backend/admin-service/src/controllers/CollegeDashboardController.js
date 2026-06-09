const service = require('../services/CollegeDashboardService');
const { asyncHandler, HttpError } = require('../middlewares/error');

/**
 * College Dashboard — for college admins only.
 * The route is mounted under adminOnly, but we additionally require a college_id
 * on the JWT so root admins (college_id=null) can't pull any college's data.
 */
exports.stats = asyncHandler(async (req, res) => {
    const collegeId = req.user?.college_id;
    if (!collegeId) {
        throw new HttpError(403, 'College Dashboard is only available to college admins');
    }
    res.json(await service.getStats({ collegeId }));
});

// Courses the root admin assigned to this college. College comes from the JWT,
// never client input — a college admin can't see another college's courses.
exports.courses = asyncHandler(async (req, res) => {
    const collegeId = req.user?.college_id;
    if (!collegeId) {
        throw new HttpError(403, 'College Dashboard is only available to college admins');
    }
    res.json({ courses: await service.getCoursesForCollege({ collegeId }) });
});

// Programs the root admin assigned to this college. College from the JWT only.
exports.programs = asyncHandler(async (req, res) => {
    const collegeId = req.user?.college_id;
    if (!collegeId) {
        throw new HttpError(403, 'College Dashboard is only available to college admins');
    }
    res.json({ programs: await service.getProgramsForCollege({ collegeId }) });
});

// Pending student signup requests for this college.
exports.studentRequests = asyncHandler(async (req, res) => {
    const collegeId = req.user?.college_id;
    if (!collegeId) {
        throw new HttpError(403, 'College Dashboard is only available to college admins');
    }
    res.json({ requests: await service.getStudentRequests({ collegeId }) });
});

// Approve a pending student request for this college.
exports.approveStudentRequest = asyncHandler(async (req, res) => {
    const collegeId = req.user?.college_id;
    if (!collegeId) {
        throw new HttpError(403, 'College Dashboard is only available to college admins');
    }
    res.json(await service.approveStudentRequest({ collegeId, userId: req.params.userId }));
});
