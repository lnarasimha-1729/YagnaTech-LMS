const service = require('./zoom.service');
const asyncHandler = require('../../shared/utils/asyncHandler');

/** Zoom integration surface — exposes createMeeting/updateMeeting/deleteMeeting
 *  via admin/bootcamp-live-class; direct HTTP surface is a thin health endpoint.
 */
exports.status = asyncHandler(async (_req, res) => {
  res.json({ provider: 'zoom', configured: false });
});

exports.service = service;
