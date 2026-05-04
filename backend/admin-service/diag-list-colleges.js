// Throwaway: list colleges & branches that the dropdown would show.
require('dotenv').config();
const { Sequelize, QueryTypes } = require('sequelize');

const authDb = new Sequelize(
    process.env.AUTH_DB_NAME, process.env.DB_USER, process.env.DB_PASS,
    { host: process.env.DB_HOST, port: process.env.DB_PORT, dialect: 'mysql', logging: false }
);

(async () => {
    try {
        const colleges = await authDb.query(
            `SELECT clgId, clgName, accesskey FROM colleges ORDER BY clgId`,
            { type: QueryTypes.SELECT }
        );
        console.log(`\n=== colleges (${colleges.length}) ===`);
        colleges.forEach((c) => console.log(`  ${c.clgId.padEnd(20)} ${c.clgName}`));

        const branches = await authDb.query(
            `SELECT branchId, branchName FROM branches ORDER BY branchId`,
            { type: QueryTypes.SELECT }
        );
        console.log(`\n=== branches (${branches.length}) ===`);
        branches.forEach((b) => console.log(`  ${b.branchId.padEnd(20)} ${b.branchName}`));

        const adminCollegeIds = await authDb.query(
            `SELECT DISTINCT u.collegeId FROM lms_admin.users u WHERE u.role IN ('admin','root') AND u.college_id IS NOT NULL`,
            { type: QueryTypes.SELECT }
        ).catch(() => []);
        console.log(`\n=== admin college_ids in lms_admin (for cross-check) ===`);
        if (!adminCollegeIds.length) {
            // Fallback: query lms_admin separately if cross-DB privileges blocked the above.
            const adminDb = new Sequelize(
                'lms_admin', process.env.DB_USER, process.env.DB_PASS,
                { host: process.env.DB_HOST, port: process.env.DB_PORT, dialect: 'mysql', logging: false }
            );
            const rows = await adminDb.query(
                `SELECT DISTINCT college_id FROM users WHERE role IN ('admin','root') AND college_id IS NOT NULL`,
                { type: QueryTypes.SELECT }
            );
            rows.forEach((r) => console.log(`  ${r.college_id}`));
            await adminDb.close();
        }
    } finally {
        await authDb.close();
    }
})();
