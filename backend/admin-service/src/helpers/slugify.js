const slugify = require('slugify');
module.exports = (str) => slugify(String(str || ''), { lower: true, strict: true });
