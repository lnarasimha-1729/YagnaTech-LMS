const { QueryTypes } = require('sequelize');
const sequelize = require('../config/database');
const authSequelize = require('../config/authDatabase');
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

// Student count lives in auth-service's database (lucy_devdb): `users` joined
// to `roles` via roleId. admin-service's own DB has neither table, so this
// MUST use the authDatabase handle — the College Dashboard service uses the
// same pattern. Logs on failure instead of swallowing silently so a stale
// connection or missing seed row is visible during debugging.
const countStudents = async () => {
    try {
        const [row] = await authSequelize.query(
            "SELECT COUNT(*) AS c FROM `users` u JOIN `roles` r ON r.roleId = u.roleId WHERE r.role = 'student'",
            { type: QueryTypes.SELECT }
        );
        return Number(row?.c || 0);
    } catch (err) {
        console.warn('[dashboard] countStudents failed:', err.message);
        return 0;
    }
};

module.exports = { safeCount, courseStatuses, countStudents };
