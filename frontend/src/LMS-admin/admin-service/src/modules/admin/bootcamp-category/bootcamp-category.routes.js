const router = require('express').Router();
const validate = require('../../../shared/middleware/validate.middleware');
const v = require('./bootcamp-category.validators');
const c = require('./bootcamp-category.controller');

/** Admin bootcamp-category routes — Admin/BootcampCategoryController.php. */
router.get('/', c.index);
router.post('/', validate(v.store), c.store);
router.put('/:id', validate(v.update), c.update);
router.delete('/:id', c.delete);

module.exports = router;
