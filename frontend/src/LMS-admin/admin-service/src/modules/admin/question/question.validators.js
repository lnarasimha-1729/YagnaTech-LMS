const { z } = require('zod');

/**
 * Admin question validators — mirror QuestionController FormRequest:
 *   title required, type required, answer required, options required_if:type,mcq.
 * Fields come in as multipart/urlencoded and may be JSON strings; the service
 * re-parses them — keep validation minimal here.
 */
const base = {
  quiz_id: z.union([z.string(), z.number()]).refine((v) => Number(v) > 0, 'quiz_id required'),
  title: z.string().trim().min(1),
  type: z.enum(['mcq', 'fill_blanks', 'true_false']),
  answer: z.any().refine((v) => v !== undefined && v !== null && v !== '', 'answer required'),
  options: z.any().optional(),
};

const withMcqOptions = z.object(base).refine(
  (d) => {
    if (d.type !== 'mcq') return true;
    const v = d.options;
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === 'string') {
      try {
        const parsed = JSON.parse(v);
        return Array.isArray(parsed) && parsed.length > 0;
      } catch {
        return false;
      }
    }
    return false;
  },
  { message: 'When type is MCQ, options are required.', path: ['options'] }
);

module.exports = {
  store: withMcqOptions,
  update: withMcqOptions,
  sort: z.object({
    itemJSON: z.any(),
  }),
};
