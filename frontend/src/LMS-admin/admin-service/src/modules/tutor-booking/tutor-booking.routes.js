const router = require('express').Router();
const c = require('./tutor-booking.controller');

/**
 * Tutor marketplace — categories, subjects, schedules, bookings
 * Laravel source: TutorBookingController, TutorCategory, TutorSubject, TutorSchedule
 *
 * TODO: port Laravel route definitions from routes/web.php / routes/api.php.
 * Mount under /api/tutor-booking from src/modules/index.js.
 */
router.get('/', c.index);
router.get('/:id', c.show);

module.exports = router;
