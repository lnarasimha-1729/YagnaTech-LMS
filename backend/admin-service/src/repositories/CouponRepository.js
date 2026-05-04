const { Op } = require('sequelize');
const { Coupon } = require('../models');

const paginate = ({ user_id, search, limit, offset }) => {
    const where = { user_id };
    if (search) where.code = { [Op.like]: `%${search}%` };
    return Coupon.findAndCountAll({ where, order: [['id', 'DESC']], limit, offset });
};

const findOne = (where) => Coupon.findOne({ where });

const create = (data) => Coupon.create(data);

const isCodeTaken = async (code, excludeId = null) => {
    const where = excludeId ? { code, id: { [Op.ne]: excludeId } } : { code };
    return Boolean(await Coupon.count({ where }));
};

module.exports = { paginate, findOne, create, isCodeTaken };
