/** Mirrors PHP Common_helper as_array(): JSON/array/object → array, else default. */
function asArray(value, def = []) {
  if (value == null) return def;
  if (Array.isArray(value)) return value;
  if (typeof value === 'object') return Object.values(value);
  if (typeof value !== 'string') return def;
  const trimmed = value.trim();
  if (!trimmed) return def;
  try {
    const decoded = JSON.parse(trimmed);
    return Array.isArray(decoded) ? decoded : def;
  } catch {
    return def;
  }
}

module.exports = { asArray };
