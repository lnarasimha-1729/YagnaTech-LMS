// Throwaway diagnostic — answers "why is the College Dashboard empty?".
// Run from backend/admin-service:   node diag-college-dashboard.js
//
// Prints, in this order:
//   1. All admin rows (lms_admin.users where role='admin') with their college_id
//   2. All distinct student collegeId values (lucy_devdb.users role=student)
//   3. For each admin's college_id, how many students match (case-insensitive,
//      trimmed) and a sample of their preScore/postScore.
//
// Once we read this output, we know exactly what to fix.

require('dotenv').config();
const { Sequelize, QueryTypes } = require('sequelize');

const adminDb = new Sequelize(
    process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS,
    { host: process.env.DB_HOST, port: process.env.DB_PORT, dialect: 'mysql', logging: false }
);
const authDb = new Sequelize(
    process.env.AUTH_DB_NAME, process.env.DB_USER, process.env.DB_PASS,
    { host: process.env.DB_HOST, port: process.env.DB_PORT, dialect: 'mysql', logging: false }
);

const fmt = (v) => (v === null || v === undefined ? '<null>' : JSON.stringify(v));

(async () => {
    try {
        console.log('\n=== 1. Admin users in lms_admin ===');
        const admins = await adminDb.query(
            `SELECT id, email, role, college_id FROM users
              WHERE role IN ('admin','root')
              ORDER BY college_id IS NULL, college_id, email`,
            { type: QueryTypes.SELECT }
        );
        admins.forEach((a) => {
            console.log(`  [${a.role}]  ${a.email.padEnd(40)} college_id=${fmt(a.college_id)}`);
        });

        console.log('\n=== 2. Distinct student collegeId values in lucy_devdb ===');
        const studentColleges = await authDb.query(
            `SELECT u.collegeId, COUNT(*) AS n
               FROM users u
               JOIN roles r ON r.roleId = u.roleId
              WHERE r.role = 'student'
              GROUP BY u.collegeId
              ORDER BY u.collegeId IS NULL, u.collegeId`,
            { type: QueryTypes.SELECT }
        );
        if (studentColleges.length === 0) {
            console.log('  (no student rows at all)');
        } else {
            studentColleges.forEach((row) => {
                console.log(`  collegeId=${fmt(row.collegeId).padEnd(28)} students=${row.n}`);
            });
        }

        console.log('\n=== 3. Per-admin match check (LOWER+TRIM) ===');
        for (const admin of admins) {
            if (!admin.college_id) {
                console.log(`\n  -- ${admin.email}: no college_id on admin row, skipped --`);
                continue;
            }
            const filter = String(admin.college_id).trim();
            const matches = await authDb.query(
                `SELECT u.userId, u.collegeId, u.preScore, u.postScore
                   FROM users u
                   JOIN roles r ON r.roleId = u.roleId
                  WHERE LOWER(TRIM(u.collegeId)) = LOWER(:filter)
                    AND r.role = 'student'`,
                { replacements: { filter }, type: QueryTypes.SELECT }
            );
            const pre = matches.filter((s) => s.preScore !== null && s.preScore !== undefined).length;
            const post = matches.filter((s) => s.postScore !== null && s.postScore !== undefined).length;
            console.log(`\n  -- ${admin.email}  (admin.college_id=${fmt(admin.college_id)}) --`);
            console.log(`     normalized filter:    ${fmt(filter)}`);
            console.log(`     student matches:      ${matches.length}`);
            console.log(`     pre-assessment done:  ${pre}`);
            console.log(`     post-assessment done: ${post}`);
            if (matches.length > 0 && matches.length <= 5) {
                console.log(`     sample:               ${JSON.stringify(matches)}`);
            } else if (matches.length > 5) {
                console.log(`     sample (first 3):     ${JSON.stringify(matches.slice(0, 3))}`);
            }
        }

        console.log('\n--- done ---\n');
    } catch (err) {
        console.error('Diagnostic failed:', err.message);
    } finally {
        await adminDb.close();
        await authDb.close();
    }
})();
