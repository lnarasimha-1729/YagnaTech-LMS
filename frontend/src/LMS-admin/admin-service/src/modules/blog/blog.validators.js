const { z } = require('zod');

/**
 * Blog posts, categories, comments, likes
 * TODO: add Zod schemas mirroring the FormRequest / validate() calls in BlogController, BlogCategoryController, BlogComment.
 */

const list = z.object({
  page: z.coerce.number().int().positive().optional(),
  per_page: z.coerce.number().int().positive().max(100).optional(),
});

module.exports = { list };
