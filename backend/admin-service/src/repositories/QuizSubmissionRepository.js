const { QuizSubmission } = require('../models');

const findById = (id) => QuizSubmission.findByPk(id);

const findByQuiz = (quiz_id) => QuizSubmission.findAll({ where: { quiz_id } });

const findByQuizAndUser = (quiz_id, user_id) =>
    QuizSubmission.findAll({
        where: { quiz_id, user_id },
        order: [['created_at', 'ASC']],
    });

const destroyByQuiz = (quiz_id) => QuizSubmission.destroy({ where: { quiz_id } });

module.exports = { findById, findByQuiz, findByQuizAndUser, destroyByQuiz };
