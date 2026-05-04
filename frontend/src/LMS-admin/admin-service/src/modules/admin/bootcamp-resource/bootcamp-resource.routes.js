const router = require('express').Router();
const upload = require('../../../shared/middleware/upload.middleware');
const validate = require('../../../shared/middleware/validate.middleware');
const v = require('./bootcamp-resource.validators');
const c = require('./bootcamp-resource.controller');

/** Admin bootcamp-resource routes — Admin/BootcampResourceController.php. */
router.post('/', upload.array('files', 20), validate(v.store), c.store);
router.get('/:id/download', c.download);
router.delete('/:id', c.delete);

module.exports = router;
