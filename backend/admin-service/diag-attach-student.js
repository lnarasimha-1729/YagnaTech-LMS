// One-shot: attach a single student to a college so we can verify the
// College Admin dashboard end-to-end without waiting for the profile UI flow.
//
// Usage:
//   node diag-attach-student.js <email> <clgId>
//   node diag-attach-student.js test@gmail.com COLLEGE001
//
// Effect:
//   UPDATE lucy_devdb.users SET collegeId='<clgId>' WHERE email='<email>'
//
// After running, log in to /admin/college as the matching college admin and
// click Refresh — the KPIs should update.

require('dotenv').config();
const { Sequelize, QueryTypes } = require('sequelize');

const [, , email, clgId] = process.argv;
if (!email || !clgId) {
    console.error('Usage: node diag-attach-student.js <email> <clgId>');
    process.exit(1);
}

const authDb = new Sequelize(
    process.env.AUTH_DB_NAME, process.env.DB_USER, process.env.DB_PASS,
    { host: process.env.DB_HOST, port: process.env.DB_PORT, dialect: 'mysql', logging: false }
);

(async () => {
    try {
        const before = await authDb.query(
            `SELECT userId, email, collegeId, preScore, postScore FROM users WHERE email = :email`,
            { replacements: { email }, type: QueryTypes.SELECT }
        );
        if (!before.length) {
            console.error(`No user with email ${email}`);
            process.exit(2);
        }
        console.log('Before:', before[0]);

        const [, affected] = await authDb.query(
            `UPDATE users SET collegeId = :clgId WHERE email = :email`,
            { replacements: { email, clgId }, type: QueryTypes.UPDATE }
        );

        const after = await authDb.query(
            `SELECT userId, email, collegeId, preScore, postScore FROM users WHERE email = :email`,
            { replacements: { email }, type: QueryTypes.SELECT }
        );
        console.log(`Rows updated: ${affected}`);
        console.log('After: ', after[0]);
    } finally {
        await authDb.close();
    }
})();
