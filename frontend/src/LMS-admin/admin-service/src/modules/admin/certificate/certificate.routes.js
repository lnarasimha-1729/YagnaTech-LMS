const router = require('express').Router();
const upload = require('../../../shared/middleware/upload.middleware');
const validate = require('../../../shared/middleware/validate.middleware');
const v = require('./certificate.validators');
const c = require('./certificate.controller');

/**
 * Admin certificate routes — gated by authorize('admin') at /api/admin parent.
 * Two surfaces share this controller:
 *   1. Coupon-style CRUD (list/edit/store/update/delete/status).
 *   2. Settings/builder/issue routes ported from the standalone certificate-module.
 *
 * The render/download route lives at /api/public/certificate/:identifier
 * (mounted from src/modules/index.js, no auth) so end users without an admin
 * token can fetch their own certificate.
 */
const multipart = upload.fields([{ name: 'template_image', maxCount: 1 }]);
const templateMultipart = upload.fields([{ name: 'certificate_template', maxCount: 1 }]);

// ---- Settings & builder (must come before /:id so /settings doesn't match show) ----
router.get('/settings', c.settings);
router.post('/template', templateMultipart, c.uploadTemplate);
router.post('/builder', validate(v.builder), c.updateBuilder);

// ---- Issue (admin-triggered or via player when progress hits 100) ----
router.post('/issue', validate(v.issue), c.issue);

// ---- Coupon-style CRUD ----
router.get('/', c.list);
router.get('/edit/:id', c.show);
router.post('/store', multipart, validate(v.store), c.store);
router.post('/update/:id', multipart, validate(v.update), c.update);
router.delete('/delete/:id', c.remove);
router.get('/status/:id', c.toggleStatus);

module.exports = router;
