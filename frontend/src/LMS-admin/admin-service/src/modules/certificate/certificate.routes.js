const router = require('express').Router();
const upload = require('../../shared/middleware/upload.middleware');
const validate = require('../../shared/middleware/validate.middleware');
const v = require('./certificate.validators');
const c = require('./certificate.controller');

/**
 * Certificate routes — mirror of modules/admin/certificate so the public-style
 * mount under /api/certificate exposes the same CRUD shape as /api/admin/certificate.
 * Accepts multipart/form-data because store/update accept an optional template_image.
 */
const multipart = upload.fields([{ name: 'template_image', maxCount: 1 }]);

router.get('/', c.list);
router.get('/edit/:id', c.show);
router.post('/store', multipart, validate(v.store), c.store);
router.post('/update/:id', multipart, validate(v.update), c.update);
router.delete('/delete/:id', c.remove);
router.get('/status/:id', c.toggleStatus);

// Backwards compatibility for previous stub callers.
router.get('/:id', c.show);

module.exports = router;
