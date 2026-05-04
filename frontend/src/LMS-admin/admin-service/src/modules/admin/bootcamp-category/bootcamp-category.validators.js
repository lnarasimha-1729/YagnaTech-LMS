const { z } = require('zod');

/** title required|string|unique — uniqueness enforced in service. */
const schema = z.object({ title: z.string().trim().min(1) });
module.exports = { store: schema, update: schema };
