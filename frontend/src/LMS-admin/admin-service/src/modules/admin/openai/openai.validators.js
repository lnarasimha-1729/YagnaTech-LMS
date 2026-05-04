const { z } = require('zod');

module.exports = {
  settings_update: z
    .object({
      open_ai_model: z.enum(['gpt-3.5-turbo-0125', 'gpt-4-0125-preview']).optional(),
      open_ai_max_token: z.union([z.string(), z.number()]).refine((v) => Number(v) >= 0, 'required'),
      open_ai_secret_key: z.string().trim().min(1).max(255),
    })
    .passthrough(),
  generate: z.object({
    service_type: z.string().trim().min(1),
    ai_keywords: z.string().trim().min(1),
    language: z.string().trim().min(1).optional(),
  }),
};
