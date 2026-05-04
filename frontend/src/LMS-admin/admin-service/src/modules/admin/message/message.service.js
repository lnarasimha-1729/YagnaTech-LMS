const { Op } = require('sequelize');
const { Message, MessageThread, User } = require('../../../models');
const AppError = require('../../../shared/errors/AppError');
const { randomToken } = require('../../../shared/utils/token');

/** 1:1 port of Admin/MessageController.php. */

async function showThread(code, user) {
  const threadDetails = code ? await MessageThread.findOne({ where: { code } }) : null;
  const contactCount = await MessageThread.count({
    where: { [Op.or]: [{ contact_one: user.id }, { contact_two: user.id }] },
  });

  if (!code) {
    const latest = await MessageThread.findOne({ order: [['id', 'DESC']], attributes: ['code'] });
    const latestCode = latest ? latest.code : null;
    if (contactCount > 0 && latestCode) return { redirect: latestCode };
    return { thread_code: '', thread_details: null };
  }

  if (threadDetails) {
    await Message.update(
      { read: 1 },
      { where: { thread_id: threadDetails.id, read: { [Op.ne]: 1 } } }
    );
  }
  return { thread_code: code, thread_details: threadDetails };
}

async function sendMessage({ body }) {
  const thread = await MessageThread.findByPk(body.thread_id);
  if (!thread) throw new AppError('Thread not found.', 404);

  await Message.create({
    message: body.message,
    sender_id: body.sender_id,
    receiver_id: body.receiver_id,
    thread_id: body.thread_id,
    read: null,
  });
  await thread.update({ updated_at: new Date() });
  return { thread_code: thread.code };
}

async function storeThread({ body, user }) {
  const authId = user.id;
  const otherId = Number(body.receiver_id);
  const has = await MessageThread.findOne({
    where: {
      [Op.or]: [
        { [Op.and]: [{ contact_one: authId }, { contact_two: otherId }] },
        { [Op.and]: [{ contact_one: otherId }, { contact_two: authId }] },
      ],
    },
  });
  if (has) return { thread_code: has.code, created: false };

  const code = randomToken(10);
  await MessageThread.create({ contact_one: authId, contact_two: otherId, code });
  return { thread_code: code, created: true };
}

async function searchThreads({ search, user, thread }) {
  const users = await User.findAll({
    where: search
      ? { [Op.or]: [{ name: { [Op.like]: `%${search}%` } }, { email: { [Op.like]: `%${search}%` } }] }
      : {},
    limit: 50,
    attributes: ['id', 'name', 'email'],
  });
  const ids = users.map((u) => u.id);
  const threads = await MessageThread.findAll({
    where: {
      [Op.or]: [
        { contact_one: user.id, contact_two: { [Op.in]: ids } },
        { contact_two: user.id, contact_one: { [Op.in]: ids } },
      ],
    },
  });
  return { message_threads: threads, search: search || '', thread: thread || '' };
}

module.exports = { showThread, sendMessage, storeThread, searchThreads };
