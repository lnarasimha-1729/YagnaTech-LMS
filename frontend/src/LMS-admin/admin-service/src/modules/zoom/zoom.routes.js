const router = require('express').Router();
const c = require('./zoom.controller');

/** Zoom status — real API calls happen server-side via zoom.service (used by admin/bootcamp). */
router.get('/', c.status);

module.exports = router;
