const { z } = require('zod');

/**
 * Realtime chat / DMs (may need websocket layer)
 * TODO: add Zod schemas mirroring the FormRequest / validate() calls in ChatController.
 */

const list = z.object({
  page: z.coerce.number().int().positive().optional(),
  per_page: z.coerce.number().int().positive().max(100).optional(),
});

module.exports = { list };
