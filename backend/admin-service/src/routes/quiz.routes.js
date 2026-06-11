const router = require('express').Router();
const ctrl = require('../controllers/QuizController');
const { adminOnly, adminOrInstructor } = require('../middlewares/auth');

// Mounted under /api/admin with only `auth` at the mount point (server.js), so
// each route picks its own role gate — mirroring the zoom-live-class module:
//   - quiz/question authoring → admin OR instructor (instructors build the
//     quizzes in the Curriculum tab of courses they're assigned to; the
//     service layer further scopes writes to those courses)
//   - results/participants    → admin only (reporting surfaces instructors
//     don't reach from the Curriculum tab)

// Quiz
router.post('/quiz', adminOrInstructor, ctrl.quiz_store);
router.post('/quiz/:id', adminOrInstructor, ctrl.quiz_update);
router.get('/quiz/:id', adminOrInstructor, ctrl.quiz_show);

// Questions
router.post('/question', adminOrInstructor, ctrl.question_store);
router.post('/question/:id', adminOrInstructor, ctrl.question_update);
router.delete('/question/:id', adminOrInstructor, ctrl.question_delete);
router.post('/question/sort', adminOrInstructor, ctrl.question_sort);

// Results
router.get('/quiz/:quiz_id/participants', adminOnly, ctrl.quiz_participants);
router.get('/quiz/:quiz_id/attempts/:user_id', adminOnly, ctrl.quiz_attempts);
router.get('/quiz-submission/:submission_id', adminOnly, ctrl.quiz_attempt_detail);

module.exports = router;
