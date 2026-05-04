const { z } = require('zod');

/**
 * Zoom provider integration (create meeting, join URL)
 * TODO: add Zod schemas mirroring the FormRequest / validate() calls in ZoomMeetingController.
 */

const list = z.object({
  page: z.coerce.number().int().positive().optional(),
  per_page: z.coerce.number().int().positive().max(100).optional(),
});

module.exports = { list };
