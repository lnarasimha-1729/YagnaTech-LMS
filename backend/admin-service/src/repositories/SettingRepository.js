const { Setting } = require('../models');

const get = async (type) => {
    const s = await Setting.findOne({ where: { type } });
    return s ? s.description : null;
};

module.exports = { get };
