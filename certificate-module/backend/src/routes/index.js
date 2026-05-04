const router = require('express').Router();
const ctrl = require('../controllers/CertificateController');
const { upload } = require('../middleware/upload');

// Admin-side settings (parallels routes/admin.php lines 250-253)
router.get('/admin/certificate/settings', ctrl.settings);
router.post('/admin/certificate/template', upload.single('certificate_template'), ctrl.updateTemplate);
router.post('/admin/certificate/builder', ctrl.updateBuilder);

// Admin certificate list / removal
router.get('/certificates', ctrl.list);
router.post('/certificates/issue', ctrl.issue);
router.delete('/certificates/:id', ctrl.destroy);

// Public render (parallels routes/student.php line 148: /certificate/{identifier})
router.get('/certificate/:identifier', ctrl.render);

module.exports = router;
