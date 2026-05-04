/* One-shot admin scaffolder — run once then delete.
 * Stamps one folder per Admin/*.php controller under src/modules/admin/<resource>/
 * with routes/controller/validators. Every action returns 501 + Laravel file:line. */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', 'src', 'modules', 'admin');

/**
 * Mapping: folder name → {
 *   file: Laravel controller filename,
 *   actions: [{ method, route, handler, php }]
 * }
 * method/route chosen to fit REST where possible; handler names match Laravel.
 */
const controllers = {
  article: {
    file: 'ArticleController.php',
    actions: [
      { method: 'get', route: '/', handler: 'index', php: 16 },
      { method: 'get', route: '/create', handler: 'create', php: 21 },
      { method: 'post', route: '/', handler: 'store', php: 26 },
      { method: 'get', route: '/:id', handler: 'show', php: 47 },
      { method: 'get', route: '/:id/edit', handler: 'edit', php: 63 },
      { method: 'put', route: '/:id', handler: 'update', php: 78 },
      { method: 'delete', route: '/:id', handler: 'destroy', php: 101 },
    ],
  },
  'bootcamp-category': {
    file: 'BootcampCategoryController.php',
    actions: [
      { method: 'get', route: '/', handler: 'index', php: 13 },
      { method: 'post', route: '/', handler: 'store', php: 20 },
      { method: 'put', route: '/:id', handler: 'update', php: 55 },
      { method: 'delete', route: '/:id', handler: 'delete', php: 40 },
    ],
  },
  bootcamp: {
    file: 'BootcampController.php',
    actions: [
      { method: 'get', route: '/:type?', handler: 'index', php: 19 },
      { method: 'get', route: '/create', handler: 'create', php: 78 },
      { method: 'get', route: '/:id/edit', handler: 'edit', php: 83 },
      { method: 'post', route: '/', handler: 'store', php: 98 },
      { method: 'put', route: '/:id', handler: 'update', php: 162 },
      { method: 'delete', route: '/:id', handler: 'delete', php: 147 },
      { method: 'post', route: '/:id/duplicate', handler: 'duplicate', php: 294 },
      { method: 'patch', route: '/:id/status', handler: 'status', php: 317 },
      { method: 'get', route: '/purchase-history', handler: 'purchase_history', php: 334 },
      { method: 'get', route: '/:id/invoice', handler: 'invoice', php: 349 },
    ],
  },
  'bootcamp-live-class': {
    file: 'BootcampLiveClassController.php',
    actions: [
      { method: 'post', route: '/', handler: 'store', php: 15 },
      { method: 'put', route: '/:id', handler: 'update', php: 100 },
      { method: 'delete', route: '/:id', handler: 'delete', php: 187 },
      { method: 'get', route: '/:slug/join', handler: 'join_class', php: 208 },
      { method: 'post', route: '/:id/stop', handler: 'stop_class', php: 239 },
      { method: 'post', route: '/sort', handler: 'sort', php: 260 },
    ],
  },
  'bootcamp-module': {
    file: 'BootcampModuleController.php',
    actions: [
      { method: 'post', route: '/', handler: 'store', php: 13 },
      { method: 'put', route: '/:id', handler: 'update', php: 65 },
      { method: 'delete', route: '/:id', handler: 'delete', php: 49 },
      { method: 'post', route: '/sort', handler: 'sort', php: 108 },
    ],
  },
  'bootcamp-resource': {
    file: 'BootcampResourceController.php',
    actions: [
      { method: 'post', route: '/', handler: 'store', php: 15 },
      { method: 'delete', route: '/:id', handler: 'delete', php: 66 },
      { method: 'get', route: '/:id/download', handler: 'download', php: 86 },
    ],
  },
  category: {
    file: 'CategoryController.php',
    actions: [
      { method: 'get', route: '/', handler: 'index', php: 12 },
      { method: 'post', route: '/', handler: 'store', php: 21 },
      { method: 'put', route: '/:id', handler: 'update', php: 62 },
      { method: 'delete', route: '/:id', handler: 'delete', php: 104 },
    ],
  },
  'knowledge-base': {
    file: 'KnowledgeBaseController.php',
    actions: [
      { method: 'get', route: '/', handler: 'index', php: 15 },
      { method: 'post', route: '/', handler: 'store', php: 30 },
      { method: 'put', route: '/:id', handler: 'update', php: 59 },
      { method: 'delete', route: '/:id', handler: 'destroy', php: 79 },
    ],
  },
  message: {
    file: 'MessageController.php',
    actions: [
      { method: 'get', route: '/:threadCode?', handler: 'message', php: 14 },
      { method: 'post', route: '/', handler: 'store', php: 33 },
      { method: 'post', route: '/thread', handler: 'thread_store', php: 59 },
      { method: 'get', route: '/threads/search', handler: 'searchThreads', php: 89 },
    ],
  },
  'offline-payment': {
    file: 'OfflinePaymentController.php',
    actions: [
      { method: 'get', route: '/', handler: 'index', php: 24 },
      { method: 'get', route: '/:id/document', handler: 'download_doc', php: 41 },
      { method: 'post', route: '/:id/accept', handler: 'accept_payment', php: 63 },
      { method: 'post', route: '/:id/decline', handler: 'decline_payment', php: 205 },
      { method: 'delete', route: '/:id', handler: 'delete_payment', php: 216 },
    ],
  },
  openai: {
    file: 'OpenAiController.php',
    actions: [
      { method: 'get', route: '/settings', handler: 'settings', php: 11 },
      { method: 'put', route: '/settings', handler: 'settings_update', php: 16 },
      { method: 'post', route: '/generate', handler: 'generate', php: 35 },
    ],
  },
  'page-builder': {
    file: 'PageBuilderController.php',
    actions: [
      { method: 'get', route: '/pages', handler: 'page_list', php: 13 },
      { method: 'post', route: '/pages', handler: 'page_store', php: 18 },
      { method: 'put', route: '/pages/:id', handler: 'page_update', php: 29 },
      { method: 'delete', route: '/pages/:id', handler: 'page_delete', php: 40 },
      { method: 'patch', route: '/pages/:id/status', handler: 'page_status', php: 47 },
      { method: 'get', route: '/pages/:id/layout', handler: 'page_layout_edit', php: 67 },
      { method: 'put', route: '/pages/:id/layout', handler: 'page_layout_update', php: 72 },
      { method: 'post', route: '/pages/layout-image', handler: 'page_layout_image_update', php: 203 },
      { method: 'get', route: '/pages/:id/preview', handler: 'preview', php: 214 },
      { method: 'get', route: '/developer-file', handler: 'developer_file_content', php: 190 },
    ],
  },
  question: {
    file: 'QuestionController.php',
    actions: [
      { method: 'post', route: '/', handler: 'store', php: 13 },
      { method: 'put', route: '/:id', handler: 'update', php: 68 },
      { method: 'delete', route: '/:id', handler: 'delete', php: 53 },
      { method: 'post', route: '/sort', handler: 'sort', php: 115 },
      { method: 'get', route: '/load-type', handler: 'load_type', php: 125 },
    ],
  },
  quiz: {
    file: 'QuizController.php',
    actions: [
      { method: 'post', route: '/', handler: 'store', php: 15 },
      { method: 'put', route: '/:id', handler: 'update', php: 81 },
      { method: 'get', route: '/result', handler: 'result', php: 147 },
      { method: 'get', route: '/result/preview', handler: 'result_preview', php: 160 },
    ],
  },
  'team-training': {
    file: 'TeamTrainingController.php',
    actions: [
      { method: 'get', route: '/', handler: 'index', php: 16 },
      { method: 'post', route: '/', handler: 'store', php: 31 },
      { method: 'get', route: '/:id/edit', handler: 'edit', php: 94 },
      { method: 'put', route: '/:id', handler: 'update', php: 103 },
      { method: 'delete', route: '/:id', handler: 'delete', php: 164 },
      { method: 'post', route: '/:id/duplicate', handler: 'duplicate', php: 171 },
      { method: 'get', route: '/courses', handler: 'get_courses', php: 184 },
      { method: 'get', route: '/course-price', handler: 'get_course_price', php: 194 },
      { method: 'patch', route: '/:id/toggle-status', handler: 'toggle_status', php: 203 },
      { method: 'get', route: '/purchase-history', handler: 'purchase_history', php: 212 },
      { method: 'get', route: '/:id/invoice', handler: 'invoice', php: 227 },
    ],
  },
  'tutor-booking': {
    file: 'TutorBookingController.php',
    actions: [
      { method: 'get', route: '/subjects', handler: 'subjects', php: 12 },
      { method: 'post', route: '/subjects', handler: 'tutor_subject_store', php: 21 },
      { method: 'put', route: '/subjects/:id', handler: 'tutor_subject_update', php: 44 },
      { method: 'patch', route: '/subjects/:id/status/:status', handler: 'tutor_subject_status', php: 67 },
      { method: 'delete', route: '/subjects/:id', handler: 'tutor_subject_delete', php: 82 },
      { method: 'get', route: '/categories', handler: 'tutor_categories', php: 91 },
      { method: 'post', route: '/categories', handler: 'tutor_category_store', php: 100 },
      { method: 'put', route: '/categories/:id', handler: 'tutor_category_update', php: 123 },
      { method: 'patch', route: '/categories/:id/status/:status', handler: 'tutor_category_status', php: 146 },
      { method: 'delete', route: '/categories/:id', handler: 'tutor_category_delete', php: 161 },
    ],
  },
};

function write(p, content) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
}

function stubRoutes(folder, meta) {
  const lines = [
    "const router = require('express').Router();",
    `const c = require('./${folder}.controller');`,
    '',
    `/**`,
    ` * Admin ${folder} routes.`,
    ` * Laravel source: app/Http/Controllers/Admin/${meta.file}`,
    ` * Gated by authorize('admin') at the parent /api/admin router.`,
    ` */`,
  ];
  for (const a of meta.actions) {
    lines.push(`router.${a.method}('${a.route}', c.${a.handler});`);
  }
  lines.push('', 'module.exports = router;', '');
  return lines.join('\n');
}

function stubController(folder, meta) {
  const header = [
    "const AppError = require('../../../shared/errors/AppError');",
    "const asyncHandler = require('../../../shared/utils/asyncHandler');",
    '',
    `/**`,
    ` * Admin ${folder} controller — 1:1 port scaffold.`,
    ` * Every handler below maps to Admin/${meta.file}.`,
    ` * TODO: replace 501 stubs with real logic ported from the PHP source.`,
    ` */`,
    '',
  ];
  const body = meta.actions.map((a) => {
    return `exports.${a.handler} = asyncHandler(async (_req, _res) => {
  // TODO: port Admin/${meta.file}:${a.php} (${a.handler})
  throw new AppError('Not implemented: admin.${folder}.${a.handler}', 501, {
    laravel: 'Admin/${meta.file}:${a.php}',
  });
});`;
  });
  return header.join('\n') + body.join('\n\n') + '\n';
}

function stubValidators(folder, meta) {
  return `const { z } = require('zod');

/**
 * Admin ${folder} validators.
 * Laravel source: app/Http/Controllers/Admin/${meta.file}
 * TODO: add Zod schemas mirroring each action's Request validation.
 */

module.exports = {};
`;
}

let total = 0;
for (const [folder, meta] of Object.entries(controllers)) {
  write(path.join(root, folder, `${folder}.routes.js`), stubRoutes(folder, meta));
  write(path.join(root, folder, `${folder}.controller.js`), stubController(folder, meta));
  write(path.join(root, folder, `${folder}.validators.js`), stubValidators(folder, meta));
  total += meta.actions.length;
}

// Top-level admin router
const adminIndexLines = [
  "const router = require('express').Router();",
  "const { authenticate, authorize } = require('../../shared/middleware/auth.middleware');",
  '',
  '// Every admin route requires an authenticated user with role=admin.',
  "router.use(authenticate, authorize('admin'));",
  '',
];
for (const folder of Object.keys(controllers)) {
  adminIndexLines.push(
    `router.use('/${folder}', require('./${folder}/${folder}.routes'));`
  );
}
adminIndexLines.push('', 'module.exports = router;', '');
write(path.join(root, 'admin.routes.js'), adminIndexLines.join('\n'));

console.log(
  `Scaffolded ${Object.keys(controllers).length} admin sub-modules (${total} actions).`
);
