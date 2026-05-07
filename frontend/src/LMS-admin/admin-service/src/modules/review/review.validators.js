const { z } = require('zod');

/**
 * Course/instructor/bootcamp reviews + like/dislike
 * TODO: add Zod schemas mirroring the FormRequest / validate() calls in ReviewController.
 */

const list = z.object({
  page: z.coerce.number().int().positive().optional(),
  per_page: z.coerce.number().int().positive().max(100).optional(),
});

module.exports = { list };
