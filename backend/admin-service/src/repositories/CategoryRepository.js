const { Op } = require('sequelize');
const { Category } = require('../models');

const findRootWithChildren = () =>
    Category.findAll({
        where: { parent_id: null },
        include: [{ model: Category, as: 'childs' }],
        order: [['sort', 'ASC']],
    });

const findById = (id) => Category.findByPk(id);

const findBySlug = (slug) => Category.findOne({ where: { slug } });

const findChildrenOf = (parentId) => Category.findAll({ where: { parent_id: parentId } });

const findChildrenIds = async (parentId) => {
    const subs = await Category.findAll({ where: { parent_id: parentId }, attributes: ['id'] });
    return subs.map((s) => s.id);
};

const isSlugTaken = async (slug, excludeId = null) => {
    const where = excludeId ? { slug, id: { [Op.ne]: excludeId } } : { slug };
    return Boolean(await Category.count({ where }));
};

const create = (data) => Category.create(data);

module.exports = {
    findRootWithChildren,
    findById,
    findBySlug,
    findChildrenOf,
    findChildrenIds,
    isSlugTaken,
    create,
};
