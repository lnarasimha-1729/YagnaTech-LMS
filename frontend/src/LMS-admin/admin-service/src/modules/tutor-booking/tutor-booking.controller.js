const service = require('./tutor-booking.service');
const asyncHandler = require('../../shared/utils/asyncHandler');

/**
 * Tutor marketplace — categories, subjects, schedules, bookings
 * TODO: mirror the CRUD/custom actions from TutorBookingController, TutorCategory, TutorSubject, TutorSchedule.
 */
exports.index = asyncHandler(async (req, res) => {
  res.json(await service.list(req.query));
});

exports.show = asyncHandler(async (req, res) => {
  res.json(await service.findById(req.params.id));
});
