const crypto = require('crypto');

const randomToken = (bytes = 40) => crypto.randomBytes(bytes).toString('hex');
const sha1 = (value) => crypto.createHash('sha1').update(value).digest('hex');
const deviceFingerprint = (userId, userAgent) =>
  Buffer.from(`${userId}${userAgent || ''}`).toString('base64');

module.exports = { randomToken, sha1, deviceFingerprint };
