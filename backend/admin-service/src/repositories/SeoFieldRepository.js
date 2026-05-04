const { SeoField } = require('../models');

const findOne = (where) => SeoField.findOne({ where });

const create = (data) => SeoField.create(data);

module.exports = { findOne, create };
