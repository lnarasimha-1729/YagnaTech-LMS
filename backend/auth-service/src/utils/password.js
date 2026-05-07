import bcrypt from 'bcrypt';

export async function hashPassword(plain) {
  const rounds = Number(process.env.BCRYPT_SALT_ROUNDS || 10);
  return bcrypt.hash(plain, rounds);
}

export async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}
