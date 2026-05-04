const { z } = require('zod');

/**
 * User CRUD + profile updates + role changes
 * TODO: add Zod schemas mirroring the FormRequest / validate() calls in UsersController, Instructor/ProfileController, Student/ProfileController.
 */

const list = z.object({
  page: z.coerce.number().int().positive().optional(),
  per_page: z.coerce.number().int().positive().max(100).optional(),
});

module.exports = { list };
