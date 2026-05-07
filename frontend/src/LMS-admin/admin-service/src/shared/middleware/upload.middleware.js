const multer = require('multer');

/**
 * Multer memory storage — keeps file buffers in RAM so downstream code can pipe
 * them through image processing (sharp) before writing via the storage layer.
 * Laravel's FileUploader pattern: validate + resize + persist in one step.
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
});

module.exports = upload;
