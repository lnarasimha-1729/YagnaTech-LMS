import College from './models/College.js';
import { generateUniqueCollegeCode } from '../utils/collegeCode.js';

// Backfill collegeCode for any existing colleges that predate the column.
// Idempotent: rows that already have a code are skipped. Runs once on startup
// (after sync) so the NOT NULL/UNIQUE column is satisfied for legacy rows
// without a separate manual migration step.
//
// Codes are assigned in a stable order (by clgId) and each generated code is
// reserved in an in-memory set as we go, so a batch backfill resolves
// collisions against both the DB and codes minted earlier in the same run.
export async function backfillCollegeCodes() {
  // Pull rows missing a code. We select raw to avoid the model's NOT NULL
  // expectation tripping on legacy NULLs during read.
  const colleges = await College.findAll({
    where: { yagId: null },
    order: [['clgId', 'ASC']],
  });

  if (!colleges.length) return 0;

  const assigned = new Set();
  const isTaken = async (code) => {
    if (assigned.has(code)) return true;
    const existing = await College.findOne({ where: { yagId: code } });
    return Boolean(existing);
  };

  let updated = 0;
  for (const college of colleges) {
    // eslint-disable-next-line no-await-in-loop
    const code = await generateUniqueCollegeCode(college.clgId, isTaken);
    assigned.add(code);
    // eslint-disable-next-line no-await-in-loop
    await college.update({ yagId: code });
    updated += 1;
  }

  console.log(`[college-service] Backfilled collegeCode for ${updated} college(s).`);
  return updated;
}
