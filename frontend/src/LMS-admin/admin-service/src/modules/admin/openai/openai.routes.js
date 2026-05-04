const router = require('express').Router();
const c = require('./openai.controller');
const v = require('./openai.validators');
const validate = require('../../../shared/middleware/validate.middleware');

/**
 * Admin openai routes.
 * Laravel source: app/Http/Controllers/Admin/OpenAiController.php
 * Gated by authorize('admin') at the parent /api/admin router.
 */
router.get('/settings', c.settings);
router.put('/settings', validate(v.settings_update), c.settings_update);
router.post('/generate', validate(v.generate), c.generate);

module.exports = router;
