const { Op } = require('sequelize');
const { Lesson, Section, Course, Question, QuizSubmission } = require('../../../models');
const AppError = require('../../../shared/errors/AppError');

/**
 * Admin quiz service — 1:1 port of Admin/QuizController.php.
 * Quizzes are Lesson rows with lesson_type='quiz'. Title uniqueness is scoped
 * to the lessons owned by the acting user's courses — matching Laravel's join chain:
 *   lessons ⨝ sections ⨝ courses.where(user_id = auth.user.id).
 */

function buildDuration({ hour, minute, second }) {
  return `${Number(hour) || 0}:${Number(minute) || 0}:${Number(second) || 0}`;
}

async function titleTakenForUser({ userId, title, excludeLessonId = null }) {
  // Emulates the Laravel inner-joins by filtering via Section→Course associations.
  const where = { title };
  if (excludeLessonId) where.id = { [Op.ne]: excludeLessonId };
  const existing = await Lesson.findOne({
    where,
    include: [
      {
        model: Section,
        required: true,
        include: [
          {
            model: Course,
            required: true,
            where: { user_id: userId },
          },
        ],
      },
    ],
  });
  return !!existing;
}

async function create({ body, user }) {
  if (await titleTakenForUser({ userId: user.id, title: body.title })) {
    throw new AppError('Title has been taken.', 422);
  }
  return Lesson.create({
    title: body.title,
    course_id: body.course_id,
    section_id: body.section,
    total_mark: body.total_mark,
    pass_mark: body.pass_mark,
    retake: body.retake,
    description: body.description || null,
    lesson_type: 'quiz',
    status: 1,
    duration: buildDuration(body),
  });
}

async function update(id, { body, user }) {
  const lesson = await Lesson.findByPk(id);
  if (!lesson) throw new AppError('Data not found.', 404);
  if (await titleTakenForUser({ userId: user.id, title: body.title, excludeLessonId: id })) {
    throw new AppError('Title has been taken.', 422);
  }
  await lesson.update({
    title: body.title,
    section_id: body.section,
    total_mark: body.total_mark,
    pass_mark: body.pass_mark,
    retake: body.retake,
    description: body.description || null,
    lesson_type: 'quiz',
    status: 1,
    duration: buildDuration(body),
  });
  return lesson;
}

async function listAttempts({ quizId, participantId }) {
  const rows = await QuizSubmission.findAll({
    where: { quiz_id: quizId, user_id: participantId },
    order: [['id', 'ASC']],
  });
  return rows.map((r, i) => ({ id: r.id, label: `Attempt ${i + 1}` }));
}

async function resultPreview({ quizId, participantId }) {
  const [quiz, results, questions] = await Promise.all([
    Lesson.findByPk(quizId),
    QuizSubmission.findAll({ where: { quiz_id: quizId, user_id: participantId } }),
    Question.findAll({ where: { quiz_id: quizId } }),
  ]);
  if (!quiz) throw new AppError('Data not found.', 404);
  return { quiz, results, questions };
}

module.exports = { create, update, listAttempts, resultPreview };
