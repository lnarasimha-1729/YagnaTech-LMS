const { z } = require('zod');

/**
 * Per-page SEO fields (title, description, og-image)
 * TODO: add Zod schemas mirroring the FormRequest / validate() calls in SeoController.
 */

const list = z.object({
  page: z.coerce.number().int().positive().optional(),
  per_page: z.coerce.number().int().positive().max(100).optional(),
});

module.exports = { list };
