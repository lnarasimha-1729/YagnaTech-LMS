const { z } = require('zod');

/**
 * Enrollments, progress, watch history
 * TODO: add Zod schemas mirroring the FormRequest / validate() calls in Student/EnrollmentController, Instructor/EnrollmentController.
 */

const list = z.object({
  page: z.coerce.number().int().positive().optional(),
  per_page: z.coerce.number().int().positive().max(100).optional(),
});

module.exports = { list };
