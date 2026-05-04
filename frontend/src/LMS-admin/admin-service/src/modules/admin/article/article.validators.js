const { z } = require('zod');

/**
 * Admin article validators — mirror ArticleController FormRequest:
 *   store: title required|max:200, description required, topick_id (parent KB) required.
 *   update: topic_name + description (no explicit Laravel rules; we require both).
 */
module.exports = {
  store: z.object({
    title: z.string().trim().min(1).max(200),
    description: z.string().trim().min(1),
    topick_id: z.union([z.string(), z.number()]).refine((v) => Number(v) > 0, 'topick_id required'),
  }),
  update: z.object({
    topic_name: z.string().trim().min(1).max(255),
    description: z.string().trim().min(1),
  }),
};
