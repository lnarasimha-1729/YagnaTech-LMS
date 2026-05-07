const { z } = require('zod');

module.exports = {
  page_store: z.object({ name: z.string().trim().min(1) }),
  page_update: z.object({ name: z.string().trim().min(1) }),
};
