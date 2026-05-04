const { z } = require('zod');

/**
 * Role-specific dashboard aggregations
 * TODO: add Zod schemas mirroring the FormRequest / validate() calls in DashboardController, Admin/DashboardController, Instructor/DashboardController, Student/DashboardController.
 */

const list = z.object({
  page: z.coerce.number().int().positive().optional(),
  per_page: z.coerce.number().int().positive().max(100).optional(),
});

module.exports = { list };
