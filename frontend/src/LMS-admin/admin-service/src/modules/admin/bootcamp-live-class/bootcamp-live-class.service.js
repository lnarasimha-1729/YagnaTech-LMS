const { Op } = require('sequelize');
const { BootcampLiveClass, BootcampModule, Bootcamp } = require('../../../models');
const AppError = require('../../../shared/errors/AppError');
const zoom = require('../../zoom/zoom.service');
const { slug } = require('../../../shared/utils/slug');

/**
 * Admin bootcamp-live-class service — 1:1 port of Admin/BootcampLiveClassController.php.
 * Time math: start/end stored as unix seconds (matches PHP strtotime()).
 * Module restriction values mirror Laravel: 1=locked before publish, 2=bounded window.
 * Zoom provider calls route through modules/zoom/zoom.service.
 */

function toEpoch(dateLike) {
  if (!dateLike) return null;
  const t = Date.parse(dateLike);
  return Number.isNaN(t) ? null : Math.floor(t / 1000);
}

function assertScheduleWithinRestriction(restriction, publish, expiry, start, end) {
  if (!restriction) return;
  if (Number(restriction) === 1 && start < publish) {
    throw new AppError('Please set class schedule properly.', 422);
  }
  if (Number(restriction) === 2) {
    const startBad = start < publish || start > expiry;
    const endBad = end < publish || end > expiry;
    if (startBad && endBad) {
      throw new AppError('Please set class schedule properly.', 422);
    }
  }
}

async function assertTitleAvailable({ userId, moduleId, title, excludeId = null }) {
  const where = { title, module_id: moduleId };
  if (excludeId) where.id = { [Op.ne]: excludeId };
  const existing = await BootcampLiveClass.findOne({
    where,
    include: [
      {
        model: BootcampModule,
        include: [{ model: Bootcamp, where: { user_id: userId }, required: true }],
        required: true,
      },
    ],
  });
  if (existing) throw new AppError('This title has been taken.', 422);
}

async function create({ body, user }) {
  const module = await BootcampModule.findByPk(body.module_id);
  if (!module) throw new AppError('Module does not exist.', 404);

  const start = toEpoch(`${body.date} ${body.start_time}`);
  const end = toEpoch(`${body.date} ${body.end_time}`);
  if (!start || !end) throw new AppError('Invalid schedule.', 422);
  if (end <= start) throw new AppError('end_time must be after start_time', 422);

  assertScheduleWithinRestriction(module.restriction, module.publish_date, module.expiry_date, start, end);
  await assertTitleAvailable({ userId: user.id, moduleId: module.id, title: body.title });

  const durationMinutes = Math.max(1, Math.round((end - start) / 60));
  const joiningData = await zoom.createMeeting(body.title, start, durationMinutes);
  if (joiningData && joiningData.code) {
    throw new AppError(joiningData.message, 422, { provider: joiningData });
  }

  return BootcampLiveClass.create({
    title: body.title,
    slug: slug(body.title),
    description: body.description,
    status: body.status,
    module_id: module.id,
    start_time: start,
    end_time: end,
    provider: 'zoom',
    joining_data: typeof joiningData === 'string' ? joiningData : JSON.stringify(joiningData || {}),
  });
}

async function update(id, { body, user }) {
  const row = await BootcampLiveClass.findOne({
    where: { id, module_id: body.module_id },
    include: [
      {
        model: BootcampModule,
        attributes: ['restriction', 'publish_date', 'expiry_date'],
        include: [{ model: Bootcamp, where: { user_id: user.id }, required: true }],
        required: true,
      },
    ],
  });
  if (!row) throw new AppError('Data not found.', 404);

  const start = toEpoch(`${body.date} ${body.start_time}`);
  const end = toEpoch(`${body.date} ${body.end_time}`);
  if (!start || !end) throw new AppError('Invalid schedule.', 422);
  const { restriction, publish_date, expiry_date } = row.BootcampModule;
  assertScheduleWithinRestriction(restriction, publish_date, expiry_date, start, end);

  await assertTitleAvailable({
    userId: user.id,
    moduleId: body.module_id,
    title: body.title,
    excludeId: id,
  });

  const data = {
    title: body.title,
    slug: slug(body.title),
    description: body.description,
    status: body.status,
    module_id: body.module_id,
    start_time: start,
    end_time: end,
  };
  if (row.start_time !== start || row.end_time !== end) data.force_stop = 0;

  if (row.provider === 'zoom' && row.joining_data) {
    let oldMeeting = {};
    try {
      oldMeeting = JSON.parse(row.joining_data);
    } catch {
      oldMeeting = {};
    }
    if (oldMeeting && oldMeeting.id) {
      await zoom.updateMeeting(body.title, body.start_time, oldMeeting.id);
      oldMeeting.start_time = new Date(start * 1000).toISOString();
      oldMeeting.topic = body.class_topic || body.title;
      data.joining_data = JSON.stringify(oldMeeting);
    }
  }

  await row.update(data);
  return row;
}

async function remove(id, user) {
  const row = await BootcampLiveClass.findOne({
    where: { id },
    include: [
      {
        model: BootcampModule,
        include: [{ model: Bootcamp, where: { user_id: user.id }, required: true }],
        required: true,
      },
    ],
  });
  if (!row) throw new AppError('Data not found.', 404);
  let oldMeeting = {};
  try {
    oldMeeting = row.joining_data ? JSON.parse(row.joining_data) : {};
  } catch {
    oldMeeting = {};
  }
  if (oldMeeting && oldMeeting.id) await zoom.deleteMeeting(oldMeeting.id);
  await row.destroy();
  return { id: Number(id) };
}

async function join(slugParam, user) {
  const row = await BootcampLiveClass.findOne({
    where: { slug: slugParam },
    include: [
      {
        model: BootcampModule,
        include: [{ model: Bootcamp, where: { user_id: user.id }, required: true, attributes: ['id', 'user_id'] }],
        required: true,
      },
    ],
  });
  if (!row) throw new AppError('Class not found.', 404);
  let meetingInfo = {};
  try {
    meetingInfo = row.joining_data ? JSON.parse(row.joining_data) : {};
  } catch {
    meetingInfo = {};
  }
  return {
    class: row,
    meeting: meetingInfo,
    start_url: meetingInfo && meetingInfo.start_url,
  };
}

async function stop(id, user) {
  const row = await BootcampLiveClass.findOne({
    where: { id },
    include: [
      {
        model: BootcampModule,
        include: [{ model: Bootcamp, where: { user_id: user.id }, required: true }],
        required: true,
      },
    ],
  });
  if (!row) throw new AppError('Data not found.', 404);
  await row.update({ force_stop: 1 });
  return { id: Number(id), force_stop: 1 };
}

function parseArr(val) {
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
}

async function sort(itemJSON) {
  const ids = parseArr(itemJSON);
  for (let i = 0; i < ids.length; i += 1) {
    await BootcampLiveClass.update({ sort: i + 1 }, { where: { id: ids[i] } });
  }
  return { sorted: ids.length };
}

module.exports = { create, update, remove, join, stop, sort };
