const { z } = require('zod');

/**
 * KB categories + topics
 * TODO: add Zod schemas mirroring the FormRequest / validate() calls in Admin/KnowledgeBaseController, Frontend/KnowledgeBaseController.
 */

const list = z.object({
  page: z.coerce.number().int().positive().optional(),
  per_page: z.coerce.number().int().positive().max(100).optional(),
});

module.exports = { list };
