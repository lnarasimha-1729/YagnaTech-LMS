const { z } = require('zod');

/**
 * Scheduled live classes (Zoom/meeting providers)
 * TODO: add Zod schemas mirroring the FormRequest / validate() calls in LiveClassController, ZoomMeetingController.
 */

const list = z.object({
  page: z.coerce.number().int().positive().optional(),
  per_page: z.coerce.number().int().positive().max(100).optional(),
});

module.exports = { list };
