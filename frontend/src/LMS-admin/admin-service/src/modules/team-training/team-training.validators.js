const { z } = require('zod');

/**
 * Team training packages, purchases, member invites
 * TODO: add Zod schemas mirroring the FormRequest / validate() calls in TeamTrainingController, TeamPackagePurchase, TeamPackageMember.
 */

const list = z.object({
  page: z.coerce.number().int().positive().optional(),
  per_page: z.coerce.number().int().positive().max(100).optional(),
});

module.exports = { list };
