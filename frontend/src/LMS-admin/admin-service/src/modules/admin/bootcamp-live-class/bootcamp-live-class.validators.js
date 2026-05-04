const { z } = require('zod');

const store = z
  .object({
    title: z.string().trim().min(1),
    date: z.string().trim().min(1),
    start_time: z.string().trim().min(1),
    end_time: z.string().trim().min(1),
    module_id: z.union([z.string(), z.number()]).refine((v) => Number(v) > 0, 'required'),
    description: z.string().trim().min(1),
    status: z.any().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.start_time && data.end_time && data.end_time <= data.start_time) {
      ctx.addIssue({ code: 'custom', path: ['end_time'], message: 'must be after start_time' });
    }
  });

const update = z.object({
  title: z.string().trim().min(1),
  start_time: z.string().trim().min(1),
  end_time: z.string().trim().min(1),
  module_id: z.union([z.string(), z.number()]).refine((v) => Number(v) > 0, 'required'),
  description: z.string().trim().min(1),
  date: z.string().optional(),
  status: z.any().optional(),
  class_topic: z.any().optional(),
});

module.exports = {
  store,
  update,
  sort: z.object({ itemJSON: z.any() }),
};
