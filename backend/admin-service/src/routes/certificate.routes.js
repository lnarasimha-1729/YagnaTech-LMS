const router = require('express').Router();
const ctrl = require('../controllers/CertificateController');
const upload = require('../middlewares/multer');

// Settings + builder (must come before /:id-style routes if any were added).
router.get('/certificate/settings', ctrl.settings);
router.post('/certificate/template', upload.single('certificate_template'), ctrl.uploadTemplate);
router.post('/certificate/builder', ctrl.updateBuilder);

// Issue (admin-triggered or via player when progress hits 100%).
router.post('/certificate/issue', ctrl.issue);

// Coupon-style table CRUD.
router.get('/certificates', ctrl.index);
router.get('/certificate/edit/:id', ctrl.show);
router.post('/certificate/store', upload.single('template_image'), ctrl.store);
router.post('/certificate/update/:id', upload.single('template_image'), ctrl.update);
router.delete('/certificate/delete/:id', ctrl.delete);
router.get('/certificate/status/:id', ctrl.status);

module.exports = router;
