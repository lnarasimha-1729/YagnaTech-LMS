const { FrontendSetting, Setting } = require('../../models');

/**
 * Settings domain.
 * - frontendMap(): returns { key: value } from frontend_settings — used by
 *   PolicyPage (privacy_policy, terms_and_condition, refund_policy, cookie_policy)
 *   and any public page that reads admin-configured HTML.
 * - globalMap(): same shape from settings table (type, description).
 */

async function frontendMap() {
  const rows = await FrontendSetting.findAll({ attributes: ['key', 'value'] });
  const out = {};
  for (const r of rows) out[r.key] = r.value;
  return out;
}

async function globalMap() {
  const rows = await Setting.findAll({ attributes: ['type', 'description'] });
  const out = {};
  for (const r of rows) out[r.type] = r.description;
  return out;
}

module.exports = { frontendMap, globalMap };
