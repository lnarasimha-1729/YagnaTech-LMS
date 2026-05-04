const { z } = require('zod');

module.exports = {
  store: z.object({
    module_id: z.union([z.string(), z.number()]).refine((v) => Number(v) > 0, 'required'),
    upload_type: z.enum(['resource', 'record']),
  }),
};
