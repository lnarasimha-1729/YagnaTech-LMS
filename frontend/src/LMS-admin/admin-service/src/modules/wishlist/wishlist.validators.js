const { z } = require('zod');

/**
 * User wishlist add/remove
 * TODO: add Zod schemas mirroring the FormRequest / validate() calls in WishlistController.
 */

const list = z.object({
  page: z.coerce.number().int().positive().optional(),
  per_page: z.coerce.number().int().positive().max(100).optional(),
});

module.exports = { list };
