const router = require('express').Router();
const validate = require('../../../shared/middleware/validate.middleware');
const v = require('./quiz.validators');
const c = require('./quiz.controller');

/**
 * Admin quiz routes — Admin/QuizController.php.
 * /result routes come before /:id so they aren't swallowed as a lesson id.
 */
router.get('/result/preview', c.result_preview);
router.get('/result', c.result);
router.post('/', validate(v.store), c.store);
router.put('/:id', validate(v.update), c.update);

module.exports = router;
