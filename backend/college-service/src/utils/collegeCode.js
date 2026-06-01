import crypto from "crypto";

// College codes are exactly 4 chars drawn from [A-Z0-9]. Generated
// deterministically from the clgId so the same college always yields the same
// code, with a retry counter mixed in only to break rare collisions.
export const CODE_LENGTH = 4;
export const CODE_PATTERN = /^[A-Z0-9]{4}$/;

// Convert a Buffer of hash bytes into an uppercase Base36 string (0-9, A-Z).
// We read the bytes as one big integer via BigInt so the whole 256-bit digest
// contributes to the result, then radix-36 encode it.
function bufferToBase36(buf) {
  let value = 0n;
  for (const byte of buf) {
    value = (value << 8n) + BigInt(byte);
  }
  return value.toString(36).toUpperCase();
}

// Produce a candidate 4-char code for a given clgId + attempt number. attempt 0
// hashes the raw clgId (the deterministic base case); subsequent attempts append
// the counter to the clgId before hashing so collisions resolve deterministically.
function computeCandidate(clgId, attempt = 0) {
  const input = attempt === 0 ? String(clgId) : `${clgId}${attempt}`;
  const hash = crypto.createHash("sha256").update(input).digest();
  const base36 = bufferToBase36(hash);
  // SHA-256 → Base36 is always far longer than 4 chars, but guard anyway: pad
  // with '0' on the unlikely short side so we never return < 4 chars.
  return base36.padStart(CODE_LENGTH, "0").slice(0, CODE_LENGTH);
}

// Deterministic base code for a clgId (attempt 0). Exposed for tests and callers
// that just want the canonical code without collision handling.
export function generateCollegeCode(clgId) {
  if (clgId === undefined || clgId === null || String(clgId).length === 0) {
    throw new Error("clgId is required to generate a college code");
  }
  return computeCandidate(clgId, 0);
}

// Resolve a unique code for clgId. `isTaken(code)` must return a truthy value
// (or a Promise of one) when the code already belongs to another college.
// Walks attempt 0, 1, 2, … until an unused code is found. maxAttempts guards
// against an unbounded loop in pathological cases.
export async function generateUniqueCollegeCode(clgId, isTaken, maxAttempts = 1000) {
  if (typeof isTaken !== "function") {
    throw new Error("isTaken callback is required");
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

// Validate a user-supplied code (e.g. at signup). Normalises case/whitespace and
// checks the exact 4-char [A-Z0-9] shape.
export function isValidCollegeCode(code) {
  if (typeof code !== "string") return false;
  return CODE_PATTERN.test(code.trim().toUpperCase());
}

export function normalizeCollegeCode(code) {
  return typeof code === "string" ? code.trim().toUpperCase() : code;
}
