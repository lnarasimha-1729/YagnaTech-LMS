const { z } = require('zod');

/**
 * Global + frontend + player + notification settings
 * TODO: add Zod schemas mirroring the FormRequest / validate() calls in SettingController, Admin/FrontendSettingController, Admin/PlayerSettingController, Admin/NotificationSettingController.
 */

const list = z.object({
  page: z.coerce.number().int().positive().optional(),
  per_page: z.coerce.number().int().positive().max(100).optional(),
});

module.exports = { list };
