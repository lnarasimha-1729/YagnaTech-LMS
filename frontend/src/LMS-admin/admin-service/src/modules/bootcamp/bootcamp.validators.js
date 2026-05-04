const { z } = require('zod');

/**
 * Bootcamp programs, modules, live classes, resources, purchases
 * TODO: add Zod schemas mirroring the FormRequest / validate() calls in Frontend/BootcampController, Admin/BootcampController, BootcampModule, BootcampLiveClass, BootcampResource.
 */

const list = z.object({
  page: z.coerce.number().int().positive().optional(),
  per_page: z.coerce.number().int().positive().max(100).optional(),
});

module.exports = { list };
