const router = require('express').Router();
const validate = require('../../../shared/middleware/validate.middleware');
const v = require('./question.validators');
const c = require('./question.controller');

/**
 * Admin question routes — Admin/QuestionController.php.
 * /sort and /load-type come before /:id so they aren't shadowed.
 */
router.post('/sort', validate(v.sort), c.sort);
router.get('/load-type', c.load_type);
router.post('/', validate(v.store), c.store);
router.put('/:id', validate(v.update), c.update);
router.delete('/:id', c.delete);

module.exports = router;
