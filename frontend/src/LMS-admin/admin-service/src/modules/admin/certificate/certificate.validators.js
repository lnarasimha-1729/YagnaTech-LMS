const { z } = require('zod');

/**
 * Admin certificate validators.
 * status is sent as a string from <select> ('1'/'0') and coerced server-side.
 * template_image is multipart, validated by multer (upload.middleware), not Zod.
 */
const baseFields = {
  title: z.string().trim().min(1).max(255),
  description: z.string().max(2000).optional().or(z.literal('')),
  status: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => (v === '' || v === undefined ? '1' : String(v))),
};

const builder = z.object({
  certificate_builder_content: z.string().min(1, 'certificate_builder_content is required'),
});

const issue = z.object({
  user_id: z.coerce.number().int().positive(),
  course_id: z.coerce.number().int().positive(),
  progress: z.coerce.number().min(0).max(100),
});

module.exports = {
  store: z.object(baseFields),
  update: z.object(baseFields),
  builder,
  issue,
};
