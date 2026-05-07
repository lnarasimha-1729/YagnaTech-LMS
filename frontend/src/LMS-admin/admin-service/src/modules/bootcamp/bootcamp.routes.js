const router = require('express').Router();
const c = require('./bootcamp.controller');

/**
 * Bootcamp programs, modules, live classes, resources, purchases
 * Laravel source: Frontend/BootcampController, Admin/BootcampController, BootcampModule, BootcampLiveClass, BootcampResource
 *
 * TODO: port Laravel route definitions from routes/web.php / routes/api.php.
 * Mount under /api/bootcamp from src/modules/index.js.
 */
router.get('/', c.index);
router.get('/:id', c.show);

module.exports = router;
