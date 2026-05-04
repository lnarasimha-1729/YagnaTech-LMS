const { Op } = require('sequelize');
const { User, Course } = require('../models');

const findById = (id) => User.findByPk(id);

const findByEmail = (email) => User.findOne({ where: { email } });

const findByIdAndRole = (id, role) => User.findOne({ where: { id, role } });

const findRootAdminId = async () => {
    const root = await User.findOne({ where: { role: 'admin' }, order: [['id', 'ASC']], attributes: ['id'] });
    return root ? root.id : null;
};

const buildSearchWhere = (role, search) => {
    const where = { role };
    if (search) {
        where[Op.or] = [
            { name: { [Op.like]: `%${search}%` } },
            { email: { [Op.like]: `%${search}%` } },
        ];
    }
    return where;
};

const paginateByRole = (role, { search, limit, offset, order }) =>
    User.findAndCountAll({ where: buildSearchWhere(role, search), limit, offset, order });

const isEmailTaken = async (email, excludeId = null) => {
    const where = excludeId ? { email, id: { [Op.ne]: excludeId } } : { email };
    return Boolean(await User.findOne({ where }));
};

const create = (data) => User.create(data);

const courseCountFor = (userId) => Course.count({ where: { user_id: userId } });

const findInstructors = () =>
    User.findAll({
        where: { role: 'instructor' },
        attributes: ['id', 'name', 'email'],
        order: [['name', 'ASC']],
    });

const findUsersByIds = (ids) =>
    ids.length
        ? User.findAll({ where: { id: ids }, attributes: ['id', 'name', 'email', 'photo'] })
        : Promise.resolve([]);

module.exports = {
    findById,
    findByEmail,
    findByIdAndRole,
    findRootAdminId,
    paginateByRole,
    isEmailTaken,
    create,
    courseCountFor,
    findInstructors,
    findUsersByIds,
};
