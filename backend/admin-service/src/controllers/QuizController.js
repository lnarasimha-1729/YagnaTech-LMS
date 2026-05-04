const quizService = require('../services/QuizService');
const { asyncHandler } = require('../middlewares/error');

// Quiz

exports.quiz_store = asyncHandler(async (req, res) => {
    res.status(201).json(await quizService.createQuiz(req.body));
});

exports.quiz_update = asyncHandler(async (req, res) => {
    res.json(await quizService.updateQuiz(req.params.id, req.body));
});

exports.quiz_show = asyncHandler(async (req, res) => {
    res.json(await quizService.showQuiz(req.params.id));
});

// Questions

exports.question_store = asyncHandler(async (req, res) => {
    res.status(201).json(await quizService.createQuestion(req.body));
});

exports.question_update = asyncHandler(async (req, res) => {
    res.json(await quizService.updateQuestion(req.params.id, req.body));
});

exports.question_delete = asyncHandler(async (req, res) => {
    res.json(await quizService.deleteQuestion(req.params.id));
});

exports.question_sort = asyncHandler(async (req, res) => {
    const ids = req.body.itemJSON || req.body.ids || [];
    res.json(await quizService.sortQuestions(ids));
});

// Results

exports.quiz_participants = asyncHandler(async (req, res) => {
    res.json(await quizService.participants(req.params.quiz_id));
});

exports.quiz_attempts = asyncHandler(async (req, res) => {
    res.json(await quizService.attempts(req.params.quiz_id, req.params.user_id));
});

exports.quiz_attempt_detail = asyncHandler(async (req, res) => {
    res.json(await quizService.attemptDetail(req.params.submission_id));
});
