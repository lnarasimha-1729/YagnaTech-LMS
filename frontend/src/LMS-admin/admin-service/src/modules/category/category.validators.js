const { z } = require('zod');

/**
 * Course taxonomy CRUD
 * TODO: add Zod schemas mirroring the FormRequest / validate() calls in Admin/CategoryController.
 */

const list = z.object({
  page: z.coerce.number().int().positive().optional(),
  per_page: z.coerce.number().int().positive().max(100).optional(),
});

module.exports = { list };
