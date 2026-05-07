const { z } = require('zod');

/**
 * Certificate validators — mirror of modules/admin/certificate.
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

const list = z.object({
  page: z.coerce.number().int().positive().optional(),
  per_page: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().optional(),
});

module.exports = {
  store: z.object(baseFields),
  update: z.object(baseFields),
  list,
};
