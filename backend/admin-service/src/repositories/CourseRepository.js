const { Course, User } = require('../models');

const paginate = ({ where, limit, offset, order, include }) =>
    Course.findAndCountAll({ where, limit, offset, order, include, distinct: !!include });

const count = (where) => Course.count({ where });

const findById = (id) => Course.findByPk(id);

const findByIdWithCreator = (id) =>
    Course.findByPk(id, { include: [{ model: User, as: 'creator' }] });

const findOne = (where) => Course.findOne({ where });

const findAll = (options) => Course.findAll(options);

const create = (data) => Course.create(data);

const updateById = (id, data) => Course.update(data, { where: { id } });

const updateWhere = (data, where) => Course.update(data, { where });

module.exports = {
    paginate,
    count,
    findById,
    findByIdWithCreator,
    findOne,
    findAll,
    create,
    updateById,
    updateWhere,
};
