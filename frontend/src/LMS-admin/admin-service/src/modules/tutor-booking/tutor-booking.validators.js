const { z } = require('zod');

/**
 * Tutor marketplace — categories, subjects, schedules, bookings
 * TODO: add Zod schemas mirroring the FormRequest / validate() calls in TutorBookingController, TutorCategory, TutorSubject, TutorSchedule.
 */

const list = z.object({
  page: z.coerce.number().int().positive().optional(),
  per_page: z.coerce.number().int().positive().max(100).optional(),
});

module.exports = { list };
