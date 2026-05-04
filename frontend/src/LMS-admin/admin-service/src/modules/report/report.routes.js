const router = require('express').Router();
const c = require('./report.controller');

/**
 * Sales/enrollment/earnings reports + CSV export
 * Laravel source: ReportController
 *
 * TODO: port Laravel route definitions from routes/web.php / routes/api.php.
 * Mount under /api/report from src/modules/index.js.
 */
router.get('/', c.index);
router.get('/:id', c.show);

module.exports = router;
