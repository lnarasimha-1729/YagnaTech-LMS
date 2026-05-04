const { Question } = require('../models');

const findById = (id) => Question.findByPk(id);

const findByQuiz = (quiz_id) =>
    Question.findAll({ where: { quiz_id }, order: [['sort', 'ASC']] });

const findLastSort = (quiz_id) =>
    Question.findOne({ where: { quiz_id }, order: [['sort', 'DESC']] });

const create = (data) => Question.create(data);

const destroyByQuiz = (quiz_id) => Question.destroy({ where: { quiz_id } });

const updateSort = (id, sort) => Question.update({ sort }, { where: { id } });

module.exports = { findById, findByQuiz, findLastSort, create, destroyByQuiz, updateSort };
