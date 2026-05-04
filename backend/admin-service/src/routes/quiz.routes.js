const router = require('express').Router();
const ctrl = require('../controllers/QuizController');

// Quiz
router.post('/quiz', ctrl.quiz_store);
router.post('/quiz/:id', ctrl.quiz_update);
router.get('/quiz/:id', ctrl.quiz_show);

// Questions
router.post('/question', ctrl.question_store);
router.post('/question/:id', ctrl.question_update);
router.delete('/question/:id', ctrl.question_delete);
router.post('/question/sort', ctrl.question_sort);

// Results
router.get('/quiz/:quiz_id/participants', ctrl.quiz_participants);
router.get('/quiz/:quiz_id/attempts/:user_id', ctrl.quiz_attempts);
router.get('/quiz-submission/:submission_id', ctrl.quiz_attempt_detail);

module.exports = router;
