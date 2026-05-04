const { z } = require('zod');

const base = z
  .object({
    title: z.string().trim().min(1),
    course_privacy: z.enum(['public', 'private']),
    course_id: z.union([z.string(), z.number()]).refine((v) => Number(v) > 0, 'required'),
    allocation: z.union([z.string(), z.number()]).refine((v) => Number(v) >= 0, 'required'),
    pricing_type: z.union([z.literal('0'), z.literal('1'), z.literal(0), z.literal(1)]),
    price: z.any().optional(),
    expiry_type: z.enum(['limited', 'lifetime']).optional(),
    expiry_date: z.any().optional(),
    is_paid: z.any().optional(),
    features: z.any().optional(),
  })
  .superRefine((data, ctx) => {
    const isPaid = String(data.is_paid || '') === '1' || String(data.pricing_type) === '1';
    if (isPaid) {
      if (data.price === undefined || data.price === null || data.price === '') {
        ctx.addIssue({ code: 'custom', path: ['price'], message: 'required' });
      }
      if (!data.expiry_type) {
        ctx.addIssue({ code: 'custom', path: ['expiry_type'], message: 'required' });
      }
    }
    if (data.expiry_type === 'limited' && !data.expiry_date) {
      ctx.addIssue({ code: 'custom', path: ['expiry_date'], message: 'required' });
    }
  });

module.exports = { store: base, update: base };
