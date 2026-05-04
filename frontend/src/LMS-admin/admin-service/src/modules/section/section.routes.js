const router = require('express').Router();
const c = require('./section.controller');

/**
 * Course sections ordering + CRUD
 * Laravel source: Instructor/SectionController, CurriculumController
 *
 * TODO: port Laravel route definitions from routes/web.php / routes/api.php.
 * Mount under /api/section from src/modules/index.js.
 */
router.get('/', c.index);
router.get('/:id', c.show);

module.exports = router;
