const service = require('./message.service');
const asyncHandler = require('../../../shared/utils/asyncHandler');

exports.message = asyncHandler(async (req, res) => {
  const result = await service.showThread(req.params.threadCode || '', req.user);
  res.json(result);
});

exports.store = asyncHandler(async (req, res) => {
  const result = await service.sendMessage({ body: req.body });
  res.status(201).json({ ...result, message: 'Your message successfully has been sent' });
});

exports.thread_store = asyncHandler(async (req, res) => {
  const result = await service.storeThread({ body: req.body, user: req.user });
  res.status(201).json({
    ...result,
    message: result.created ? 'Message thread successfully created' : 'Thread already exists',
  });
});

exports.searchThreads = asyncHandler(async (req, res) => {
  const result = await service.searchThreads({
    search: req.query.search,
    thread: req.query.thread,
    user: req.user,
  });
  res.json(result);
});
