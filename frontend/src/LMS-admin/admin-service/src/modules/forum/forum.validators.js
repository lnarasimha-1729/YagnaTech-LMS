const { z } = require('zod');

/**
 * Course Q&A / forum threads + replies
 * TODO: add Zod schemas mirroring the FormRequest / validate() calls in ForumController.
 */

const list = z.object({
  page: z.coerce.number().int().positive().optional(),
  per_page: z.coerce.number().int().positive().max(100).optional(),
});

module.exports = { list };
