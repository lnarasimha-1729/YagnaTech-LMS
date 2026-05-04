const { z } = require('zod');

/**
 * Quizzes, submissions, scoring
 * TODO: add Zod schemas mirroring the FormRequest / validate() calls in Instructor/QuizController, Student/QuizController, QuizSubmission.
 */

const list = z.object({
  page: z.coerce.number().int().positive().optional(),
  per_page: z.coerce.number().int().positive().max(100).optional(),
});

module.exports = { list };
