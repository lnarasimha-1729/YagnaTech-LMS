const router = require('express').Router();
const c = require('./user.controller');

/**
 * User CRUD + profile updates + role changes
 * Laravel source: UsersController, Instructor/ProfileController, Student/ProfileController
 *
 * TODO: port Laravel route definitions from routes/web.php / routes/api.php.
 * Mount under /api/user from src/modules/index.js.
 */
router.get('/', c.index);
router.get('/:id', c.show);

module.exports = router;
