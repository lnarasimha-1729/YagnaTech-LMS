const { z } = require('zod');

/**
 * Admin bootcamp validators — mirror BootcampController FormRequest per tab:
 *   store: title, description, category_id, is_paid (0|1), conditional price, discount_flag, discounted_price
 *   update: tab-specific (basic/pricing/info/media/seo); schema picks the branch off `tab`.
 */
const pickPriceRules = (body) => {
  const issues = [];
  if (String(body.is_paid) === '1') {
    const n = Number(body.price);
    if (!(Number.isFinite(n) && n >= 1)) {
      issues.push({ path: ['price'], message: 'price required when paid' });
    }
  }
  if (String(body.discount_flag) === '1') {
    const n = Number(body.discounted_price);
    if (!(Number.isFinite(n) && n >= 1)) {
      issues.push({ path: ['discounted_price'], message: 'discounted_price required when discounted' });
    }
  }
  return issues;
};

const store = z
  .object({
    title: z.string().trim().min(1),
    description: z.string().trim().min(1),
    category_id: z.union([z.string(), z.number()]).refine((v) => Number(v) > 0, 'required'),
    is_paid: z.enum(['0', '1']),
    price: z.any().optional(),
    discount_flag: z.enum(['', '1']).optional().or(z.literal(undefined)),
    discounted_price: z.any().optional(),
    short_description: z.any().optional(),
    publish_date: z.any().optional(),
  })
  .superRefine((data, ctx) => {
    for (const issue of pickPriceRules(data)) {
      ctx.addIssue({ code: 'custom', ...issue });
    }
  });

/** update() branches on body.tab — validate only the subset for that tab. */
const update = z
  .object({ tab: z.enum(['basic', 'pricing', 'info', 'media', 'seo']) })
  .passthrough()
  .superRefine((data, ctx) => {
    if (data.tab === 'basic') {
      if (!data.title || !String(data.title).trim())
        ctx.addIssue({ code: 'custom', path: ['title'], message: 'required' });
      if (!data.description || !String(data.description).trim())
        ctx.addIssue({ code: 'custom', path: ['description'], message: 'required' });
      if (!data.category_id)
        ctx.addIssue({ code: 'custom', path: ['category_id'], message: 'required' });
    } else if (data.tab === 'pricing') {
      if (!['0', '1'].includes(String(data.is_paid)))
        ctx.addIssue({ code: 'custom', path: ['is_paid'], message: 'invalid' });
      for (const issue of pickPriceRules(data))
        ctx.addIssue({ code: 'custom', ...issue });
    }
    // info/media/seo: no strict field requirements — matches PHP behavior where
    // missing pieces just become nulls or no-ops.
  });

module.exports = { store, update };
