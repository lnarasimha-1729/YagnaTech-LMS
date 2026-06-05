const router = require('express').Router();
const { rootOnly } = require('../middlewares/auth');
const ctrl = require('../controllers/CollegeController');

// Managing colleges is root-only. Mounted with `auth` only (see server.js), so
// rootOnly is applied here per-route to avoid blocking the whole /api/admin
// namespace for college admins.
router.get('/colleges', rootOnly, ctrl.index);
router.get('/colleges/:id', rootOnly, ctrl.show);
router.post('/colleges', rootOnly, ctrl.store);
// POST-on-update mirrors admin.routes.js so the frontend can use one
// multipart-friendly verb across CRUD pages. (No file uploads here yet, but
// keeping the verb consistent avoids special-casing the API client.)
router.post('/colleges/:id', rootOnly, ctrl.update);
router.delete('/colleges/:id', rootOnly, ctrl.destroy);
// Manage Colleges → Options → Revoke / Give Access. POST + boolean keeps
// the verb consistent with /colleges/:id update and avoids PATCH-handling
// quirks in the existing client.
router.post('/colleges/:id/access', rootOnly, ctrl.setAccess);

module.exports = router;
