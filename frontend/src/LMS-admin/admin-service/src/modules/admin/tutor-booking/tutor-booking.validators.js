const { z } = require('zod');

const nameOnly = z.object({ name: z.string().trim().min(1).max(255) });

module.exports = {
  subject_store: nameOnly,
  subject_update: nameOnly,
  category_store: nameOnly,
  category_update: nameOnly,
};
