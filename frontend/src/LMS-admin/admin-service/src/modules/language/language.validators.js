const { z } = require('zod');

/**
 * Multi-language support, phrase translations
 * TODO: add Zod schemas mirroring the FormRequest / validate() calls in LanguageController.
 */

const list = z.object({
  page: z.coerce.number().int().positive().optional(),
  per_page: z.coerce.number().int().positive().max(100).optional(),
});

module.exports = { list };
