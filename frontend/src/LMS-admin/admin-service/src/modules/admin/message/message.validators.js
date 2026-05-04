const { z } = require('zod');

const intId = z.union([z.string(), z.number()]).refine((v) => Number.isInteger(Number(v)) && Number(v) > 0, 'required');

module.exports = {
  store: z.object({
    message: z.string().trim().min(1),
    sender_id: intId,
    receiver_id: intId,
    thread_id: intId,
  }),
  thread_store: z.object({
    receiver_id: intId,
  }),
};
