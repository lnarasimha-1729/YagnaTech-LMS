const { z } = require('zod');

const storeBase = z.object({
  title: z.string().trim().min(1),
  validity: z.string().trim().min(1),
  bootcamp_id: z.union([z.string(), z.number()]).refine((v) => Number(v) > 0, 'required'),
  restriction: z.any().optional(),
});

const updateBase = z.object({
  title: z.string().trim().min(1),
  validity: z.string().trim().min(1),
  bootcamp_id: z.union([z.string(), z.number()]).refine((v) => Number(v) > 0, 'required'),
  restriction: z.any().optional(),
});

module.exports = {
  store: storeBase,
  update: updateBase,
  sort: z.object({ itemJSON: z.any() }),
};
