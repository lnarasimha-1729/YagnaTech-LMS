/* One-shot scaffolder — run once then delete. Stamps routes/controller/service/validators
 * into src/modules/<name>/ for every domain except auth (already implemented). */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', 'src', 'modules');

const modules = {
  blog: { map: 'BlogController, BlogCategoryController, BlogComment', desc: 'Blog posts, categories, comments, likes' },
  bootcamp: { map: 'Frontend/BootcampController, Admin/BootcampController, BootcampModule, BootcampLiveClass, BootcampResource', desc: 'Bootcamp programs, modules, live classes, resources, purchases' },
  cart: { map: 'CartController, Addtocart', desc: 'Shopping cart (add/remove/clear, merge guest cart)' },
  category: { map: 'Admin/CategoryController', desc: 'Course taxonomy CRUD' },
  certificate: { map: 'Frontend/CertificateController', desc: 'Course completion certificates (PDF generation stub)' },
  chat: { map: 'ChatController', desc: 'Realtime chat / DMs (may need websocket layer)' },
  coupon: { map: 'CouponController', desc: 'Coupon codes — validate, apply, CRUD' },
  course: { map: 'CourseController, CurriculumController, Instructor/CourseController', desc: 'Core course CRUD + curriculum, ratings, filters' },
  dashboard: { map: 'DashboardController, Admin/DashboardController, Instructor/DashboardController, Student/DashboardController', desc: 'Role-specific dashboard aggregations' },
  enrollment: { map: 'Student/EnrollmentController, Instructor/EnrollmentController', desc: 'Enrollments, progress, watch history' },
  file: { map: 'FileController, WatermarkController', desc: 'Uploads, watermarking, signed media delivery' },
  forum: { map: 'ForumController', desc: 'Course Q&A / forum threads + replies' },
  'home-page': { map: 'Frontend/HomeController, Admin/HomePageSettingController', desc: 'Homepage content blocks + settings' },
  'knowledge-base': { map: 'Admin/KnowledgeBaseController, Frontend/KnowledgeBaseController', desc: 'KB categories + topics' },
  language: { map: 'LanguageController', desc: 'Multi-language support, phrase translations' },
  lesson: { map: 'Instructor/LessonController, CurriculumController', desc: 'Lessons within sections (video, text, attachment)' },
  'live-class': { map: 'LiveClassController, ZoomMeetingController', desc: 'Scheduled live classes (Zoom/meeting providers)' },
  media: { map: 'FileController, MediaFile', desc: 'Media library — uploads, browsing, deletion' },
  message: { map: 'MessageController', desc: 'User-to-user messaging threads' },
  newsletter: { map: 'NewsletterController', desc: 'Newsletter composition + subscriber list' },
  notification: { map: 'NotificationController', desc: 'In-app notifications + settings' },
  'page-builder': { map: 'Admin/BuilderController', desc: 'Dynamic CMS pages' },
  payment: { map: 'PaymentController, InvoiceController, PaymentGateway, OfflinePayment, Payout', desc: 'Checkout, gateways, invoices, offline payments, instructor payouts' },
  question: { map: 'Instructor/QuestionController', desc: 'Quiz questions CRUD' },
  quiz: { map: 'Instructor/QuizController, Student/QuizController, QuizSubmission', desc: 'Quizzes, submissions, scoring' },
  report: { map: 'ReportController', desc: 'Sales/enrollment/earnings reports + CSV export' },
  review: { map: 'ReviewController', desc: 'Course/instructor/bootcamp reviews + like/dislike' },
  section: { map: 'Instructor/SectionController, CurriculumController', desc: 'Course sections ordering + CRUD' },
  seo: { map: 'SeoController', desc: 'Per-page SEO fields (title, description, og-image)' },
  settings: { map: 'SettingController, Admin/FrontendSettingController, Admin/PlayerSettingController, Admin/NotificationSettingController', desc: 'Global + frontend + player + notification settings' },
  'team-training': { map: 'TeamTrainingController, TeamPackagePurchase, TeamPackageMember', desc: 'Team training packages, purchases, member invites' },
  'tutor-booking': { map: 'TutorBookingController, TutorCategory, TutorSubject, TutorSchedule', desc: 'Tutor marketplace — categories, subjects, schedules, bookings' },
  user: { map: 'UsersController, Instructor/ProfileController, Student/ProfileController', desc: 'User CRUD + profile updates + role changes' },
  wishlist: { map: 'WishlistController', desc: 'User wishlist add/remove' },
  zoom: { map: 'ZoomMeetingController', desc: 'Zoom provider integration (create meeting, join URL)' },
};

const toCamel = (n) => n.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

function write(p, content) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
}

const ROUTES = (dir, meta) => `const router = require('express').Router();
const c = require('./${dir}.controller');

/**
 * ${meta.desc}
 * Laravel source: ${meta.map}
 *
 * TODO: port Laravel route definitions from routes/web.php / routes/api.php.
 * Mount under /api/${dir} from src/modules/index.js.
 */
router.get('/', c.index);
router.get('/:id', c.show);

module.exports = router;
`;

const CTRL = (dir, meta) => `const service = require('./${dir}.service');
const asyncHandler = require('../../shared/utils/asyncHandler');

/**
 * ${meta.desc}
 * TODO: mirror the CRUD/custom actions from ${meta.map}.
 */
exports.index = asyncHandler(async (req, res) => {
  res.json(await service.list(req.query));
});

exports.show = asyncHandler(async (req, res) => {
  res.json(await service.findById(req.params.id));
});
`;

const SVC = (dir, meta, nm) => `const AppError = require('../../shared/errors/AppError');
// const models = require('../../models');
// Pull in the specific models this domain owns, e.g. { Course } = models.

/**
 * ${meta.desc}
 * TODO: implement business logic ported from ${meta.map}.
 */

async function list(/* query */) {
  // TODO: paginate + filter. Use shared/utils/pagination.js.
  return { data: [], meta: { total: 0 } };
}

async function findById(id) {
  // TODO: findByPk + 404
  throw new AppError(\`${nm} #\${id} not found\`, 404);
}

module.exports = { list, findById };
`;

const VAL = (dir, meta) => `const { z } = require('zod');

/**
 * ${meta.desc}
 * TODO: add Zod schemas mirroring the FormRequest / validate() calls in ${meta.map}.
 */

const list = z.object({
  page: z.coerce.number().int().positive().optional(),
  per_page: z.coerce.number().int().positive().max(100).optional(),
});

module.exports = { list };
`;

let count = 0;
for (const [dir, meta] of Object.entries(modules)) {
  const nm = toCamel(dir);
  write(path.join(root, dir, `${dir}.routes.js`), ROUTES(dir, meta));
  write(path.join(root, dir, `${dir}.controller.js`), CTRL(dir, meta));
  write(path.join(root, dir, `${dir}.service.js`), SVC(dir, meta, nm));
  write(path.join(root, dir, `${dir}.validators.js`), VAL(dir, meta));
  count++;
}

console.log(`Scaffolded ${count} module skeletons.`);
