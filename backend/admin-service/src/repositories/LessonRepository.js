const { Lesson } = require('../models');

const findById = (id) => Lesson.findByPk(id);

const findByCourse = (course_id) => Lesson.findAll({ where: { course_id } });

const findBySectionIds = (sectionIds) =>
    sectionIds.length
        ? Lesson.findAll({ where: { section_id: sectionIds }, order: [['sort', 'ASC']] })
        : Promise.resolve([]);

const findLastSortInCourse = (course_id) =>
    Lesson.findOne({ where: { course_id }, order: [['sort', 'DESC']] });

const findOne = (where) => Lesson.findOne({ where });

const create = (data) => Lesson.create(data);

const updateSort = (id, sort) => Lesson.update({ sort }, { where: { id } });

module.exports = {
    findById,
    findByCourse,
    findBySectionIds,
    findLastSortInCourse,
    findOne,
    create,
    updateSort,
};
