// Seed colleges so existing admin college_id codes have matching rows. After
// this runs the student profile dropdown will list these colleges by name,
// and a student picking one will save its clgId — which equals the admin's
// college_id, so the College Admin dashboard aggregates against them.
//
// Usage:  node diag-seed-colleges.js
//
// Idempotent — uses INSERT ... ON DUPLICATE KEY UPDATE so re-runs are safe.

require('dotenv').config();
const { Sequelize, QueryTypes } = require('sequelize');

const authDb = new Sequelize(
    process.env.AUTH_DB_NAME, process.env.DB_USER, process.env.DB_PASS,
    { host: process.env.DB_HOST, port: process.env.DB_PORT, dialect: 'mysql', logging: false }
);

// Pulled from the diagnostic — these are the codes admins were created with.
// Add more here if new admins are seeded with new codes.
const COLLEGES = [
    { clgId: 'COLLEGE001', clgName: 'College One',          accesskey: 'ak_college001' },
    { clgId: '45678',      clgName: 'Demo Institute (45678)', accesskey: 'ak_45678' },
];

(async () => {
    try {
        for (const c of COLLEGES) {
            await authDb.query(
                `INSERT INTO colleges (clgId, accesskey, clgName, createdAt, updatedAt)
                 VALUES (:clgId, :accesskey, :clgName, NOW(), NOW())
                 ON DUPLICATE KEY UPDATE clgName = VALUES(clgName), updatedAt = NOW()`,
                { replacements: c, type: QueryTypes.INSERT }
            );
            console.log(`  upserted ${c.clgId} -> ${c.clgName}`);
        }
        const all = await authDb.query(
            `SELECT clgId, clgName FROM colleges ORDER BY clgName`,
            { type: QueryTypes.SELECT }
        );
        console.log(`\n=== colleges table (${all.length}) ===`);
        all.forEach((r) => console.log(`  ${r.clgId.padEnd(15)} ${r.clgName}`));
    } catch (err) {
        console.error('Seed failed:', err.message);
        process.exitCode = 1;
    } finally {
        await authDb.close();
    }
})();
