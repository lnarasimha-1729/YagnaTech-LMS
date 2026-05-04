const { z } = require('zod');

module.exports = {
  list: z.object({ status: z.enum(['approved', 'suspended', 'pending']).optional() }),
};
