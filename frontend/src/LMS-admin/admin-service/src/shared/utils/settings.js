const { Setting } = require('../../models');

/**
 * Mirrors PHP get_settings($type). `settings` table uses columns (type, description).
 * Returns description string or null.
 */
async function getSetting(type) {
  const row = await Setting.findOne({ where: { type } });
  return row ? row.description : null;
}

module.exports = { getSetting };
