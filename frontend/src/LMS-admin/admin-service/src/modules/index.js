/**
 * Central route registry. Mounts every domain module under /api/<name>.
 * Add a new module by dropping a folder into src/modules/ and appending it here.
 */
const router = require('express').Router();

// Scaffold stubs: the frontend admin UI expects these shapes, but the
// corresponding controllers aren't ported yet. Return empty so the pages
// render without 404s. Remove each entry as the real endpoint ships.
const empty = { data: [], meta: { current_page: 1, last_page: 1, total: 0 } };
const stubs = [
  ['get', '/dashboard/stats', { courses: 0, lessons: 0, enrollments: 0, students: 0, instructors: 0 }],
  ['get', '/dashboard/revenue', { monthly_amount: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] }],
  ['get', '/dashboard/course/status', { statuses: [0, 0, 0, 0, 0, 0] }],
  ['get', '/dashboard/payouts', { payouts: [] }],
  ['get', '/admins', empty],
  ['get', '/instructors', empty],
  ['get', '/students', empty],
  ['get', '/courses', empty],
  ['get', '/course/categories', empty],
  ['get', '/course/instructors', empty],
  ['get', '/categories', empty],
  ['get', '/blogs', empty],
  ['get', '/enrollments', empty],
  ['get', '/coupons', empty],
  ['get', '/contacts', empty],
  ['get', '/newsletter', empty],
  ['get', '/knowledge-base', empty],
];
for (const [method, path, payload] of stubs) {
  router[method](path, (_req, res) => res.json(payload));
}

const modules = [
  ['admin', require('./admin/admin.routes')],
  ['auth', require('./auth/auth.routes')],
  ['blog', require('./blog/blog.routes')],
  ['bootcamp', require('./bootcamp/bootcamp.routes')],
  ['cart', require('./cart/cart.routes')],
  ['category', require('./category/category.routes')],
  ['certificate', require('./certificate/certificate.routes')],
  ['chat', require('./chat/chat.routes')],
  ['coupon', require('./coupon/coupon.routes')],
  ['course', require('./course/course.routes')],
  ['dashboard', require('./dashboard/dashboard.routes')],
  ['enrollment', require('./enrollment/enrollment.routes')],
  ['file', require('./file/file.routes')],
  ['forum', require('./forum/forum.routes')],
  ['frontend-settings', require('./frontend-settings/frontend-settings.routes')],
  ['home-page', require('./home-page/home-page.routes')],
  ['knowledge-base', require('./knowledge-base/knowledge-base.routes')],
  ['language', require('./language/language.routes')],
  ['lesson', require('./lesson/lesson.routes')],
  ['live-class', require('./live-class/live-class.routes')],
  ['media', require('./media/media.routes')],
  ['message', require('./message/message.routes')],
  ['newsletter', require('./newsletter/newsletter.routes')],
  ['notification', require('./notification/notification.routes')],
  ['page-builder', require('./page-builder/page-builder.routes')],
  ['payment', require('./payment/payment.routes')],
  ['question', require('./question/question.routes')],
  ['quiz', require('./quiz/quiz.routes')],
  ['report', require('./report/report.routes')],
  ['review', require('./review/review.routes')],
  ['section', require('./section/section.routes')],
  ['seo', require('./seo/seo.routes')],
  ['settings', require('./settings/settings.routes')],
  ['team-training', require('./team-training/team-training.routes')],
  ['tutor-booking', require('./tutor-booking/tutor-booking.routes')],
  ['user', require('./user/user.routes')],
  ['wishlist', require('./wishlist/wishlist.routes')],
  ['zoom', require('./zoom/zoom.routes')],
];

for (const [name, r] of modules) router.use(`/${name}`, r);

// Public (unauthenticated) routes — for end-user-facing certificate downloads.
router.use('/public', require('./public/certificate.public.routes'));

module.exports = router;
