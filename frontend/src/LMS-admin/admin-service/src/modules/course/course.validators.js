const { z } = require('zod');

/**
 * Core course CRUD + curriculum, ratings, filters
 * TODO: add Zod schemas mirroring the FormRequest / validate() calls in CourseController, CurriculumController, Instructor/CourseController.
 */

const list = z.object({
  page: z.coerce.number().int().positive().optional(),
  per_page: z.coerce.number().int().positive().max(100).optional(),
});

module.exports = { list };
