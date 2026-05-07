const router = require('express').Router();
const c = require('./page-builder.controller');
const v = require('./page-builder.validators');
const validate = require('../../../shared/middleware/validate.middleware');
const upload = require('../../../shared/middleware/upload.middleware');

/**
 * Admin page-builder routes.
 * Laravel source: app/Http/Controllers/Admin/PageBuilderController.php
 * Gated by authorize('admin') at the parent /api/admin router.
 */
router.get('/pages', c.page_list);
router.post('/pages', validate(v.page_store), c.page_store);
router.put('/pages/:id', validate(v.page_update), c.page_update);
router.delete('/pages/:id', c.page_delete);
router.patch('/pages/:id/status', c.page_status);
router.get('/pages/:id/layout', c.page_layout_edit);
router.put('/pages/:id/layout', c.page_layout_update);
router.post('/pages/layout-image', upload.single('file'), c.page_layout_image_update);
router.get('/pages/:id/preview', c.preview);
router.get('/developer-file', c.developer_file_content);

module.exports = router;
