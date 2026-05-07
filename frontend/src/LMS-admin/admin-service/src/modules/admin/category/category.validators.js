const { z } = require('zod');

/**
 * Admin category validators — mirror CategoryController store/update FormRequest:
 *   title required|max:255, parent_id nullable, icon required,
 *   keywords max:400, description max:500.
 * File fields are validated by multer (upload.middleware), not Zod.
 */
const baseFields = {
  title: z.string().trim().min(1).max(255),
  parent_id: z
    .union([z.string(), z.number(), z.null()])
    .optional()
    .transform((v) => (v === '' || v === undefined ? null : v)),
  icon: z.string().trim().min(1),
  keywords: z.string().max(400).optional().or(z.literal('')),
  description: z.string().max(500).optional().or(z.literal('')),
};

module.exports = {
  store: z.object(baseFields),
  update: z.object(baseFields),
};
