const path = require('path');
const { slug } = require('./slug');

/**
 * Mirrors Laravel's nice_file_name(): `slugify(title)-<unix-timestamp>.<ext>`.
 * Accepts either a bare extension ("png") or a filename from which ext is derived.
 */
function niceFileName(title, extOrFilename) {
  const ext = String(extOrFilename || '')
    .replace(/^.*\./, '')
    .toLowerCase() || 'bin';
  return `${slug(title)}-${Math.floor(Date.now() / 1000)}.${ext}`;
}

/** Pull the extension from a multer file (`originalname` or mimetype fallback). */
function extOf(file) {
  if (!file) return 'bin';
  const fromName = path.extname(file.originalname || '').replace(/^\./, '');
  if (fromName) return fromName.toLowerCase();
  const mime = (file.mimetype || '').split('/').pop();
  return (mime || 'bin').toLowerCase();
}

module.exports = { niceFileName, extOf };
