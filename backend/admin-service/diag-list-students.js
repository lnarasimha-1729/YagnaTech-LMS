// Throwaway: list all student emails + their current collegeId so we can pick
// one to attach to COLLEGE001 (or whichever admin you log in as).
require('dotenv').config();
const { Sequelize, QueryTypes } = require('sequelize');

const authDb = new Sequelize(
    process.env.AUTH_DB_NAME, process.env.DB_USER, process.env.DB_PASS,
    { host: process.env.DB_HOST, port: process.env.DB_PORT, dialect: 'mysql', logging: false }
);

(async () => {
    const rows = await authDb.query(
        `SELECT u.userId, u.email, u.name, u.collegeId, u.preScore, u.postScore
           FROM users u
           JOIN roles r ON r.roleId = u.roleId
          WHERE r.role = 'student'
          ORDER BY u.collegeId IS NULL, u.collegeId, u.email`,
        { type: QueryTypes.SELECT }
    );
    rows.forEach((r) => {
        console.log(
            `  userId=${String(r.userId).padEnd(6)} email=${String(r.email).padEnd(40)} ` +
            `college=${JSON.stringify(r.collegeId || '').padEnd(18)} pre=${r.preScore ?? '-'} post=${r.postScore ?? '-'}`
        );
    });
    await authDb.close();
})();
