const { z } = require('zod');

/**
 * Shopping cart (add/remove/clear, merge guest cart)
 * TODO: add Zod schemas mirroring the FormRequest / validate() calls in CartController, Addtocart.
 */

const list = z.object({
  page: z.coerce.number().int().positive().optional(),
  per_page: z.coerce.number().int().positive().max(100).optional(),
});

module.exports = { list };
