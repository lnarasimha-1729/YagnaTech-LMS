const router = require('express').Router();
const ctrl = require('../controllers/CollegeDashboardController');

// Mounted under /api/admin (adminOnly). Inner check ensures only callers with
// a college_id (i.e. college admins, not root) can reach the data.
router.get('/college-dashboard/stats', ctrl.stats);
// Courses assigned to the caller's college (read-only).
router.get('/college-dashboard/courses', ctrl.courses);
// Programs assigned to the caller's college (read-only).
router.get('/college-dashboard/programs', ctrl.programs);
// Pending student signup requests for the caller's college + approve.
router.get('/college-dashboard/student-requests', ctrl.studentRequests);
router.post('/college-dashboard/student-requests/:userId/approve', ctrl.approveStudentRequest);

module.exports = router;
