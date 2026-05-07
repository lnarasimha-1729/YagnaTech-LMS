const router = require('express').Router();
const c = require('../admin/certificate/certificate.controller');

/**
 * Public certificate render route — unauthenticated, mirrors Laravel's
 * HomeController@download_certificate (route /certificate/{identifier}).
 * Returns the rendered HTML + QR code so end users can fetch the certificate
 * without an admin session. Admin auth-gated routes live under /api/admin/certificate.
 */
router.get('/certificate/:identifier', c.render);

module.exports = router;
