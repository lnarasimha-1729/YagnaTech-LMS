const { Op } = require('sequelize');
const { BootcampModule, Bootcamp } = require('../../../models');
const AppError = require('../../../shared/errors/AppError');

/**
 * Admin bootcamp-module service — 1:1 port of Admin/BootcampModuleController.php.
 * Uniqueness scope: module title is unique across modules belonging to ANY bootcamp
 * the acting user owns (matches PHP join: bootcamp_modules ⨝ bootcamps.user_id).
 */

function parseValidity(validity) {
  if (!validity) return { publish_date: null, expiry_date: null };
  const [start, end] = String(validity).split('-').map((s) => s.trim());
  const toEpoch = (d) => {
    if (!d) return null;
    const t = Date.parse(d);
    return Number.isNaN(t) ? null : Math.floor(t / 1000);
  };
  return { publish_date: toEpoch(start), expiry_date: toEpoch(end) };
}

async function assertTitleAvailable({ userId, title, excludeId = null }) {
  const where = { title };
  if (excludeId) where.id = { [Op.ne]: excludeId };
  const existing = await BootcampModule.findOne({
    where,
    include: [{ model: Bootcamp, where: { user_id: userId }, required: true }],
  });
  if (existing) throw new AppError('This title has been taken.', 422);
}

async function create({ body, user }) {
  await assertTitleAvailable({ userId: user.id, title: body.title });
  const { publish_date, expiry_date } = parseValidity(body.validity);
  return BootcampModule.create({
    title: body.title,
    restriction: body.restriction || null,
    bootcamp_id: body.bootcamp_id,
    publish_date,
    expiry_date,
  });
}

async function update(id, { body, user }) {
  const mod = await BootcampModule.findOne({
    where: { id, bootcamp_id: body.bootcamp_id },
  });
  if (!mod) throw new AppError('Data not found.', 404);
  await assertTitleAvailable({ userId: user.id, title: body.title, excludeId: id });
  const { publish_date, expiry_date } = parseValidity(body.validity);
  await mod.update({
    title: body.title,
    restriction: body.restriction || null,
    publish_date,
    expiry_date,
  });
  return mod;
}

async function remove(id) {
  const mod = await BootcampModule.findByPk(id);
  if (!mod) throw new AppError('Data not found.', 404);
  await mod.destroy();
  return { id: Number(id) };
}

async function sort(itemJSON) {
  const parseArr = (val) => {
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') {
      try {
        const out = JSON.parse(val);
        return Array.isArray(out) ? out : [];
      } catch {
        return [];
      }
    }
    return [];
  };
  const ids = parseArr(itemJSON);
  for (let i = 0; i < ids.length; i += 1) {
    await BootcampModule.update({ sort: i + 1 }, { where: { id: ids[i] } });
  }
  return { sorted: ids.length };
}

module.exports = { create, update, remove, sort };
