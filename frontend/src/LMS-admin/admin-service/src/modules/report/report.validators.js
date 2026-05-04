const { z } = require('zod');

/**
 * Sales/enrollment/earnings reports + CSV export
 * TODO: add Zod schemas mirroring the FormRequest / validate() calls in ReportController.
 */

const list = z.object({
  page: z.coerce.number().int().positive().optional(),
  per_page: z.coerce.number().int().positive().max(100).optional(),
});

module.exports = { list };
