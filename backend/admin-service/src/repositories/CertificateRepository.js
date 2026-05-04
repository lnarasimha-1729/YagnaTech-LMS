const { Op } = require('sequelize');
const { Certificate, User, Course } = require('../models');

const includeJoins = [
    { model: User, as: 'user', attributes: ['id', 'name', 'email'], required: false },
    { model: Course, as: 'course', attributes: ['id', 'title', 'slug'], required: false },
];

const paginate = async ({ search, limit, offset }) => {
    const where = {};
    if (search) {
        const term = `%${String(search).trim()}%`;
        where[Op.or] = [{ title: { [Op.like]: term } }, { identifier: { [Op.like]: term } }];
    }
    // Try with joins; fall back to plain query if association columns are missing
    // (legacy DBs sometimes drop FK columns admin-service expects).
    try {
        return await Certificate.findAndCountAll({
            where, include: includeJoins, order: [['id', 'DESC']], limit, offset,
        });
    } catch (err) {
        console.warn('[certificate.paginate] include failed, falling back:', err.message);
        return Certificate.findAndCountAll({ where, order: [['id', 'DESC']], limit, offset });
    }
};

const findById = (id) => Certificate.findOne({ where: { id } });

const findByIdWithJoins = async (id) => {
    try {
        return await Certificate.findOne({ where: { id }, include: includeJoins });
    } catch {
        return Certificate.findOne({ where: { id } });
    }
};

const findByIdentifier = async (identifier) => {
    try {
        return await Certificate.findOne({ where: { identifier }, include: includeJoins });
    } catch {
        return Certificate.findOne({ where: { identifier } });
    }
};

const findByPair = (user_id, course_id) =>
    Certificate.findOne({ where: { user_id, course_id } });

const findAllForUser = async (user_id) => {
    try {
        return await Certificate.findAll({
            where: { user_id }, include: includeJoins, order: [['issued_at', 'DESC'], ['id', 'DESC']],
        });
    } catch (err) {
        console.warn('[certificate.findAllForUser] include failed, falling back:', err.message);
        return Certificate.findAll({ where: { user_id }, order: [['id', 'DESC']] });
    }
};

const create = (data) => Certificate.create(data);

module.exports = {
    paginate, findById, findByIdWithJoins, findByIdentifier, findByPair, findAllForUser, create,
};
