const router = require('express').Router();
const c = require('../settings/settings.controller');

/** Public key/value map from `frontend_settings` (privacy_policy, terms_and_condition, refund_policy, cookie_policy, etc). */
router.get('/', c.frontend);

module.exports = router;
