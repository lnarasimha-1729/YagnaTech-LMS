const { QueryTypes } = require('sequelize');
const sequelize = require('../config/database');
const { Course } = require('../models');

const safeCount = async (table, where = '') => {
    try {
        const [row] = await sequelize.query(
            `SELECT COUNT(*) AS c FROM \`${table}\` ${where ? 'WHERE ' + where : ''}`,
            { type: QueryTypes.SELECT }
        );
        return Number(row.c || 0);
    } catch {
        return 0;
    }
};

const courseStatuses = () => Course.findAll({ attributes: ['status'] });

module.exports = { safeCount, courseStatuses };
