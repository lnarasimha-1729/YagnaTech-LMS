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
