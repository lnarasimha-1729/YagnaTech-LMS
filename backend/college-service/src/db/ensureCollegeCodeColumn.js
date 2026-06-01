import sequelize from './sequelize.js';
import { QueryTypes } from 'sequelize';

// Idempotent startup migration for the colleges.yagId column.
//
// Sequelize sync() (without alter) never adds new columns to an existing table,
// and a NOT NULL column can't be added to a table that already has rows. So we
// stage it the safe way, mirroring the DESCRIBE-then-ALTER pattern admin-service
// uses in its server.js startup:
//
//   0. Drop a legacy collegeCode column if it's still present (the column was
//      renamed to yagId; backfill reproduces the same deterministic codes).
//   1. Add the column as NULLABLE if it's missing (so existing rows survive).
//   2. (Caller then backfills codes for the NULL rows.)
//   3. Enforce NOT NULL + UNIQUE + index once every row has a value.
//
// Each step checks current schema state first, so re-running on an
// already-migrated DB is a no-op.

async function tableExists() {
  const rows = await sequelize.query('SHOW TABLES LIKE :t', {
    replacements: { t: 'colleges' },
    type: QueryTypes.SELECT,
  });
  return rows.length > 0;
}

async function columnExists(column) {
  const rows = await sequelize.query('DESCRIBE colleges', { type: QueryTypes.SELECT });
  return rows.some((r) => r.Field === column);
}

async function indexExists(indexName) {
  const rows = await sequelize.query(
    'SHOW INDEX FROM colleges WHERE Key_name = :name',
    { replacements: { name: indexName }, type: QueryTypes.SELECT }
  );
  return rows.length > 0;
}

// Step 0: drop a pre-existing legacy collegeCode column. yagId is created fresh
// (step 1) and backfilled — codes are deterministic from clgId, so colleges get
// the same value back. No-op once the legacy column is gone (or on a fresh DB).
export async function dropLegacyCollegeCodeColumn() {
  if (!(await tableExists())) return false;
  if (!(await columnExists('collegeCode'))) return false;
  await sequelize.query('ALTER TABLE colleges DROP COLUMN collegeCode');
  console.log('[college-service] Dropped legacy colleges.collegeCode column.');
  return true;
}

// Step 1: add the nullable column if absent. Returns true when it created it.
// No-op on a fresh DB where the table doesn't exist yet — sync() will then
// create it with the model's full NOT NULL/UNIQUE shape directly.
export async function addCollegeCodeColumnIfMissing() {
  if (!(await tableExists())) return false;
  if (await columnExists('yagId')) return false;
  await sequelize.query('ALTER TABLE colleges ADD COLUMN yagId CHAR(4) NULL AFTER clgId');
  console.log('[college-service] Added nullable colleges.yagId column.');
  return true;
}

// Step 3: enforce constraints once all rows have a code. Skips quietly if any
// NULLs remain (e.g. backfill couldn't run) so startup never crashes the
// service on the constraint step.
export async function enforceCollegeCodeConstraints() {
  const [{ nulls }] = await sequelize.query(
    'SELECT COUNT(*) AS nulls FROM colleges WHERE yagId IS NULL',
    { type: QueryTypes.SELECT }
  );
  if (Number(nulls) > 0) {
    console.warn(
      `[college-service] Skipping yagId NOT NULL/UNIQUE — ${nulls} row(s) still NULL.`
    );
    return false;
  }

  // MODIFY to NOT NULL (idempotent: re-running just re-asserts the same shape).
  await sequelize.query('ALTER TABLE colleges MODIFY COLUMN yagId CHAR(4) NOT NULL');

  if (!(await indexExists('colleges_yagId_unique'))) {
    await sequelize.query(
      'ALTER TABLE colleges ADD UNIQUE INDEX colleges_yagId_unique (yagId)'
    );
    console.log('[college-service] Added UNIQUE index on colleges.yagId.');
  }
  return true;
}
