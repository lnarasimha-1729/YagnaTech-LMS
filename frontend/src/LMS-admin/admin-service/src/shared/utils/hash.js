const bcrypt = require('bcrypt');

const ROUNDS = 12;

async function hashPassword(plain) {
  return bcrypt.hash(plain, ROUNDS);
}

/** Laravel emits $2y$; Node bcrypt wants $2a$/$2b$. Flip the prefix so existing hashes verify. */
async function verifyPassword(plain, stored) {
  if (!stored) return false;
  const normalized = stored.startsWith('$2y$') ? '$2b$' + stored.slice(4) : stored;
  return bcrypt.compare(plain, normalized);
}

module.exports = { hashPassword, verifyPassword };
