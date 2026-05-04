const multer = require('multer');
const path = require('path');
const fs = require('fs');

const tmp = path.join(__dirname, '..', '..', 'tmp');
if (!fs.existsSync(tmp)) fs.mkdirSync(tmp, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, tmp),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

module.exports = multer({ storage, limits: { fileSize: 200 * 1024 * 1024 } });
