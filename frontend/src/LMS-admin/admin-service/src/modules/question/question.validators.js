const { z } = require('zod');

/**
 * Quiz questions CRUD
 * TODO: add Zod schemas mirroring the FormRequest / validate() calls in Instructor/QuestionController.
 */

const list = z.object({
  page: z.coerce.number().int().positive().optional(),
  per_page: z.coerce.number().int().positive().max(100).optional(),
});

module.exports = { list };
