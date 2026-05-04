const service = require('./quiz.service');
const asyncHandler = require('../../../shared/utils/asyncHandler');

/** Admin quiz controller — 1:1 port of Admin/QuizController.php. */

exports.store = asyncHandler(async (req, res) => {
  const quiz = await service.create({ body: req.body, user: req.user });
  res.status(201).json({ data: quiz, message: 'Quiz has been created.' });
});

exports.update = asyncHandler(async (req, res) => {
  const quiz = await service.update(req.params.id, { body: req.body, user: req.user });
  res.json({ data: quiz, message: 'Quiz has been updated.' });
});

exports.result = asyncHandler(async (req, res) => {
  const attempts = await service.listAttempts({
    quizId: req.query.quizId,
    participantId: req.query.participant,
  });
  res.json({ data: attempts });
});

exports.result_preview = asyncHandler(async (req, res) => {
  const data = await service.resultPreview({
    quizId: req.query.quizId,
    participantId: req.query.participantId,
  });
  res.json(data);
});
