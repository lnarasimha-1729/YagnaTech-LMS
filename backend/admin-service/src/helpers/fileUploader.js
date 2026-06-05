const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const env = require('../config/env');

const ROOT = path.join(__dirname, '..', '..', env.uploadDir);

const ensureDir = (dir) => { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); };

const niceFileName = (title, ext) => {
    const base = String(title || 'file').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return `${base}-${Date.now()}.${ext}`;
};

const upload = async (file, destPath, width = null, height = null) => {
    if (!file) return null;
    const full = path.join(__dirname, '..', '..', destPath);
    ensureDir(path.dirname(full));
    if (width || height) {
        await sharp(file.path).resize(width, height, { fit: 'cover' }).toFile(full);
        fs.unlinkSync(file.path);
    } else {
        // rename() fails with EXDEV when src and dest live on different
        // filesystems — which is exactly the prod case: /app/tmp is the
        // container overlay fs while /app/uploads is a mounted Docker volume.
        // Try the fast rename first; fall back to copy+unlink across devices.
        try {
            fs.renameSync(file.path, full);
        } catch (err) {
            if (err.code !== 'EXDEV') throw err;
            fs.copyFileSync(file.path, full);
            fs.unlinkSync(file.path);
        }
    }
    return destPath;
};

const removeFile = (relPath) => {
    if (!relPath) return;
    const full = path.join(__dirname, '..', '..', relPath);
    if (fs.existsSync(full)) fs.unlinkSync(full);
};

module.exports = { upload, removeFile, niceFileName, ROOT };
