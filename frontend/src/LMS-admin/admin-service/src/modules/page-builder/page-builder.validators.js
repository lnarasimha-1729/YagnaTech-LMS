const { z } = require('zod');

/**
 * Dynamic CMS pages
 * TODO: add Zod schemas mirroring the FormRequest / validate() calls in Admin/BuilderController.
 */

const list = z.object({
  page: z.coerce.number().int().positive().optional(),
  per_page: z.coerce.number().int().positive().max(100).optional(),
});

module.exports = { list };
