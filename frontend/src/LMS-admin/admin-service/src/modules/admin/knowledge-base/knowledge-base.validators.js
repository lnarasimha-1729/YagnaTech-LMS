const { z } = require('zod');

/** Admin knowledge-base validators — title required|max:200 for store + update. */
const titleSchema = z.object({
  title: z.string().trim().min(1).max(200),
});

module.exports = { store: titleSchema, update: titleSchema };
