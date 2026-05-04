const { z } = require('zod');

/**
 * Homepage content blocks + settings
 * TODO: add Zod schemas mirroring the FormRequest / validate() calls in Frontend/HomeController, Admin/HomePageSettingController.
 */

const list = z.object({
  page: z.coerce.number().int().positive().optional(),
  per_page: z.coerce.number().int().positive().max(100).optional(),
});

module.exports = { list };
