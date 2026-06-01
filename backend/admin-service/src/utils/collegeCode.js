const crypto = require('crypto');

// CommonJS port of college-service/src/utils/collegeCode.js. Kept byte-for-byte
// compatible so a yagId minted here is identical to one college-service would
// derive for the same clgId — colleges created from either side interchange.
//
// Codes are exactly 4 chars drawn from [A-Z0-9], generated deterministically
// from the clgId, with a retry counter mixed in only to break rare collisions.
const CODE_LENGTH = 4;

// Read the hash bytes as one big integer (whole 256-bit digest contributes),
// then radix-36 encode to an uppercase [0-9A-Z] string.
function bufferToBase36(buf) {
  let value = 0n;
  for (const byte of buf) {
    value = (value << 8n) + BigInt(byte);
  }
  return value.toString(36).toUpperCase();
}

// Candidate code for a clgId + attempt. attempt 0 hashes the raw clgId (the
// deterministic base case); later attempts append the counter before hashing.
function computeCandidate(clgId, attempt = 0) {
  const input = attempt === 0 ? String(clgId) : `${clgId}${attempt}`;
  const hash = crypto.createHash('sha256').update(input).digest();
  const base36 = bufferToBase36(hash);
  return base36.padStart(CODE_LENGTH, '0').slice(0, CODE_LENGTH);
}

// Resolve a unique code for clgId. `isTaken(code)` returns truthy (or a Promise
// of one) when the code already belongs to another college. Walks attempt
// 0, 1, 2, … until an unused code is found.
async function generateUniqueCollegeCode(clgId, isTaken, maxAttempts = 1000) {
  if (clgId === undefined || clgId === null || String(clgId).length === 0) {
    throw new Error('clgId is required to generate a college code');
  }
  if (typeof isTaken !== 'function') {
    throw new Error('isTaken callback is required');
  }
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const candidate = computeCandidate(clgId, attempt);
    // eslint-disable-next-line no-await-in-loop
    if (!(await isTaken(candidate))) {
      return candidate;
    }
  }
  throw new Error(
    `Unable to generate a unique college code for clgId=${clgId} after ${maxAttempts} attempts`
  );
}

module.exports = { CODE_LENGTH, generateUniqueCollegeCode };
