const { z } = require('zod');

/**
 * Media library — uploads, browsing, deletion
 * TODO: add Zod schemas mirroring the FormRequest / validate() calls in FileController, MediaFile.
 */

const list = z.object({
  page: z.coerce.number().int().positive().optional(),
  per_page: z.coerce.number().int().positive().max(100).optional(),
});

module.exports = { list };
