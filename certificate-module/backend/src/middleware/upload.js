const path = require('path');
const fs = require('fs');
const multer = require('multer');

const baseUploadDir = path.join(__dirname, '..', '..', process.env.UPLOAD_DIR || 'uploads');
const templateDir = path.join(baseUploadDir, 'certificate-template');

if (!fs.existsSync(templateDir)) fs.mkdirSync(templateDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, templateDir),
    filename: (_req, file, cb) => {
        const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
        cb(null, `${Date.now()}-${safe}`);
    },
});

const fileFilter = (_req, file, cb) => {
    if (!/^image\//.test(file.mimetype)) return cb(new Error('certificate_template must be an image'));
    cb(null, true);
};

module.exports = {
    upload: multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } }),
    baseUploadDir,
    templateDir,
    relativeTemplatePath: (filename) => `uploads/certificate-template/${filename}`,
};
