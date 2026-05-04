const router = require('express').Router();
const validate = require('../../../shared/middleware/validate.middleware');
const v = require('./bootcamp-module.validators');
const c = require('./bootcamp-module.controller');

/** Admin bootcamp-module routes — Admin/BootcampModuleController.php. */
router.post('/sort', validate(v.sort), c.sort);
router.post('/', validate(v.store), c.store);
router.put('/:id', validate(v.update), c.update);
router.delete('/:id', c.delete);

module.exports = router;
