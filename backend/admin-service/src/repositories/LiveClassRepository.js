const { LiveClass } = require('../models');

const findById = (id) => LiveClass.findByPk(id);

const findByCourse = (course_id) =>
    LiveClass.findAll({
        where: { course_id },
        order: [['class_date_and_time', 'ASC']],
    });

const create = (data) => LiveClass.create(data);

module.exports = { findById, findByCourse, create };
