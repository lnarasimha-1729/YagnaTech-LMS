const router = require('express').Router();
const c = require('./dashboard.controller');

/**
 * Role-specific dashboard aggregations
 * Laravel source: DashboardController, Admin/DashboardController, Instructor/DashboardController, Student/DashboardController
 *
 * TODO: port Laravel route definitions from routes/web.php / routes/api.php.
 * Mount under /api/dashboard from src/modules/index.js.
 */
router.get('/', c.index);
router.get('/:id', c.show);

module.exports = router;
