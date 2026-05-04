const { z } = require('zod');

/**
 * Lessons within sections (video, text, attachment)
 * TODO: add Zod schemas mirroring the FormRequest / validate() calls in Instructor/LessonController, CurriculumController.
 */

const list = z.object({
  page: z.coerce.number().int().positive().optional(),
  per_page: z.coerce.number().int().positive().max(100).optional(),
});

module.exports = { list };
