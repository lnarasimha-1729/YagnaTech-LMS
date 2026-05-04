const { Section } = require('../models');

const findByCourse = (course_id) =>
    Section.findAll({ where: { course_id }, order: [['sort', 'ASC']] });

const findById = (id) => Section.findByPk(id);

const findLastSort = (course_id) =>
    Section.findOne({ where: { course_id }, order: [['sort', 'DESC']] });

const create = (data) => Section.create(data);

const updateSort = (id, sort) => Section.update({ sort }, { where: { id } });

module.exports = { findByCourse, findById, findLastSort, create, updateSort };
