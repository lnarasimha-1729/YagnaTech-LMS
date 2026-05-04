const router = require('express').Router();
const c = require('./team-training.controller');

/**
 * Team training packages, purchases, member invites
 * Laravel source: TeamTrainingController, TeamPackagePurchase, TeamPackageMember
 *
 * TODO: port Laravel route definitions from routes/web.php / routes/api.php.
 * Mount under /api/team-training from src/modules/index.js.
 */
router.get('/', c.index);
router.get('/:id', c.show);

module.exports = router;
