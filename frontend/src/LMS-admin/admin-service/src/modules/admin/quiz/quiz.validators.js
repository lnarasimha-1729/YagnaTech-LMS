const { z } = require('zod');

/**
 * Admin quiz validators — mirror QuizController FormRequest + after() hooks:
 *   title required, section required|numeric, total_mark required|numeric,
 *   pass_mark required|numeric, retake required|numeric|min:1,
 *   hour 0..23, minute 0..59, second 0..59 (all coerced from strings).
 * Cross-field rules: duration must be > 0 total; pass_mark ≤ total_mark.
 */
const numFromStr = z.preprocess(
  (v) => (v === '' || v === undefined || v === null ? undefined : Number(v)),
  z.number()
);

const base = z
  .object({
    title: z.string().trim().min(1),
    course_id: z.union([z.string(), z.number()]).optional(),
    section: numFromStr.refine((n) => Number.isFinite(n) && n > 0, 'section required'),
    total_mark: numFromStr.refine((n) => Number.isFinite(n) && n >= 0),
    pass_mark: numFromStr.refine((n) => Number.isFinite(n) && n >= 0),
    retake: numFromStr.refine((n) => Number.isFinite(n) && n >= 1, 'min 1'),
    hour: numFromStr.refine((n) => n >= 0 && n <= 23, 'max:23').optional(),
    minute: numFromStr.refine((n) => n >= 0 && n <= 59, 'max:59').optional(),
    second: numFromStr.refine((n) => n >= 0 && n <= 59, 'max:59').optional(),
    description: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const hour = data.hour || 0;
    const minute = data.minute || 0;
    const second = data.second || 0;
    if (hour === 0 && minute === 0 && second === 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['second'],
        message: 'If hour and minute are 0, second must be greater than 0.',
      });
    }
    if (data.pass_mark > data.total_mark) {
      ctx.addIssue({
        code: 'custom',
        path: ['pass_mark'],
        message: 'The pass mark must be less than the total mark.',
      });
    }
  });

module.exports = { store: base, update: base };
