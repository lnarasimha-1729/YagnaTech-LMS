const router = require('express').Router();
const c = require('./settings.controller');

/** Global settings (from `settings` table: type/description). */
router.get('/', c.global);

module.exports = router;
