const dashboardService = require('../services/DashboardService');
const { asyncHandler } = require('../middlewares/error');

exports.index = asyncHandler(async (_req, res) => {
    res.json(await dashboardService.stats());
});
