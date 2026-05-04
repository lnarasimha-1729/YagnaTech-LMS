const { z } = require('zod');

/**
 * Coupon codes — validate, apply, CRUD
 * TODO: add Zod schemas mirroring the FormRequest / validate() calls in CouponController.
 */

const list = z.object({
  page: z.coerce.number().int().positive().optional(),
  per_page: z.coerce.number().int().positive().max(100).optional(),
});

module.exports = { list };
