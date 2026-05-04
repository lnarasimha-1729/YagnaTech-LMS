const slugify = require('slugify');

/** Mirrors Laravel's Str::slug behavior for URL-safe slugs. */
const slug = (value, sep = '-') =>
  slugify(String(value || ''), { lower: true, strict: true, replacement: sep });

module.exports = { slug };
