const router = require('express').Router();
const { authenticate, authorize } = require('../../shared/middleware/auth.middleware');

// Every admin route requires an authenticated user with role=admin.
router.use(authenticate, authorize('admin'));

router.use('/article', require('./article/article.routes'));
router.use('/bootcamp-category', require('./bootcamp-category/bootcamp-category.routes'));
router.use('/bootcamp', require('./bootcamp/bootcamp.routes'));
router.use('/bootcamp-live-class', require('./bootcamp-live-class/bootcamp-live-class.routes'));
router.use('/bootcamp-module', require('./bootcamp-module/bootcamp-module.routes'));
router.use('/bootcamp-resource', require('./bootcamp-resource/bootcamp-resource.routes'));
router.use('/category', require('./category/category.routes'));
router.use('/certificate', require('./certificate/certificate.routes'));
router.use('/certificates', require('./certificate/certificate.routes'));
router.use('/knowledge-base', require('./knowledge-base/knowledge-base.routes'));
router.use('/message', require('./message/message.routes'));
router.use('/offline-payment', require('./offline-payment/offline-payment.routes'));
router.use('/openai', require('./openai/openai.routes'));
router.use('/page-builder', require('./page-builder/page-builder.routes'));
router.use('/question', require('./question/question.routes'));
router.use('/quiz', require('./quiz/quiz.routes'));
router.use('/team-training', require('./team-training/team-training.routes'));
router.use('/tutor-booking', require('./tutor-booking/tutor-booking.routes'));

module.exports = router;
