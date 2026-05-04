const { z } = require('zod');

/**
 * User-to-user messaging threads
 * TODO: add Zod schemas mirroring the FormRequest / validate() calls in MessageController.
 */

const list = z.object({
  page: z.coerce.number().int().positive().optional(),
  per_page: z.coerce.number().int().positive().max(100).optional(),
});

module.exports = { list };
