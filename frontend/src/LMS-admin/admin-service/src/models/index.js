const sequelize = require('../config/db');

const defineUser = require('./User');
const definePasswordResetToken = require('./PasswordResetToken');
const defineDeviceIp = require('./DeviceIp');
const defineCategory = require('./Category');
const defineCourse = require('./Course');
const defineSection = require('./Section');
const defineLesson = require('./Lesson');
const defineEnrollment = require('./Enrollment');
const defineQuiz = require('./Quiz');
const defineQuestion = require('./Question');
const defineQuizSubmission = require('./QuizSubmission');
const defineBlog = require('./Blog');
const defineBlogCategory = require('./BlogCategory');
const defineBlogComment = require('./BlogComment');
const defineBlogLike = require('./BlogLike');
const defineBootcamp = require('./Bootcamp');
const defineBootcampCategory = require('./BootcampCategory');
const defineBootcampModule = require('./BootcampModule');
const defineBootcampPurchase = require('./BootcampPurchase');
const defineBootcampResource = require('./BootcampResource');
const defineBootcampLiveClass = require('./BootcampLiveClass');
const defineCartItem = require('./CartItem');
const defineAddtocart = require('./Addtocart');
const defineWishlist = require('./Wishlist');
const defineCoupon = require('./Coupon');
const defineCertificate = require('./Certificate');
const defineForum = require('./Forum');
const defineKnowledgeBase = require('./KnowledgeBase');
const defineKnowledgeBaseTopick = require('./KnowledgeBaseTopick');
const defineLanguage = require('./Language');
const defineLanguagePhrase = require('./LanguagePhrase');
const defineLiveClass = require('./LiveClass');
const defineMediaFile = require('./MediaFile');
const defineMessage = require('./Message');
const defineMessageThread = require('./MessageThread');
const defineNewsletter = require('./Newsletter');
const defineNewsletterSubscriber = require('./NewsletterSubscriber');
const defineNotificationSetting = require('./NotificationSetting');
const defineNotification = require('./Notification');
const definePaymentGateway = require('./PaymentGateway');
const definePaymentHistory = require('./PaymentHistory');
const defineOfflinePayment = require('./OfflinePayment');
const definePayout = require('./Payout');
const defineReview = require('./Review');
const defineInstructorReview = require('./InstructorReview');
const defineUserReview = require('./UserReview');
const defineTutorReview = require('./TutorReview');
const defineLikeDislikeReview = require('./LikeDislikeReview');
const defineWatchHistory = require('./WatchHistory');
const defineWatchDuration = require('./WatchDuration');
const defineFrontendSetting = require('./FrontendSetting');
const defineSetting = require('./Setting');
const defineHomePageSetting = require('./HomePageSetting');
const definePlayerSettings = require('./PlayerSettings');
const defineSeoField = require('./SeoField');
const defineBuilderPage = require('./BuilderPage');
const defineContact = require('./Contact');
const defineCountry = require('./Country');
const defineCurrency = require('./Currency');
const definePermission = require('./Permission');
const defineApplication = require('./Application');
const defineTeamTrainingPackage = require('./TeamTrainingPackage');
const defineTeamPackagePurchase = require('./TeamPackagePurchase');
const defineTeamPackageMember = require('./TeamPackageMember');
const defineTutorCategory = require('./TutorCategory');
const defineTutorSubject = require('./TutorSubject');
const defineTutorCanTeach = require('./TutorCanTeach');
const defineTutorSchedule = require('./TutorSchedule');
const defineTutorBooking = require('./TutorBooking');

const User = defineUser(sequelize);
const PasswordResetToken = definePasswordResetToken(sequelize);
const DeviceIp = defineDeviceIp(sequelize);
const Category = defineCategory(sequelize);
const Course = defineCourse(sequelize);
const Section = defineSection(sequelize);
const Lesson = defineLesson(sequelize);
const Enrollment = defineEnrollment(sequelize);
const Quiz = defineQuiz(sequelize);
const Question = defineQuestion(sequelize);
const QuizSubmission = defineQuizSubmission(sequelize);
const Blog = defineBlog(sequelize);
const BlogCategory = defineBlogCategory(sequelize);
const BlogComment = defineBlogComment(sequelize);
const BlogLike = defineBlogLike(sequelize);
const Bootcamp = defineBootcamp(sequelize);
const BootcampCategory = defineBootcampCategory(sequelize);
const BootcampModule = defineBootcampModule(sequelize);
const BootcampPurchase = defineBootcampPurchase(sequelize);
const BootcampResource = defineBootcampResource(sequelize);
const BootcampLiveClass = defineBootcampLiveClass(sequelize);
const CartItem = defineCartItem(sequelize);
const Addtocart = defineAddtocart(sequelize);
const Wishlist = defineWishlist(sequelize);
const Coupon = defineCoupon(sequelize);
const Certificate = defineCertificate(sequelize);
const Forum = defineForum(sequelize);
const KnowledgeBase = defineKnowledgeBase(sequelize);
const KnowledgeBaseTopick = defineKnowledgeBaseTopick(sequelize);
const Language = defineLanguage(sequelize);
const LanguagePhrase = defineLanguagePhrase(sequelize);
const LiveClass = defineLiveClass(sequelize);
const MediaFile = defineMediaFile(sequelize);
const Message = defineMessage(sequelize);
const MessageThread = defineMessageThread(sequelize);
const Newsletter = defineNewsletter(sequelize);
const NewsletterSubscriber = defineNewsletterSubscriber(sequelize);
const NotificationSetting = defineNotificationSetting(sequelize);
const Notification = defineNotification(sequelize);
const PaymentGateway = definePaymentGateway(sequelize);
const PaymentHistory = definePaymentHistory(sequelize);
const OfflinePayment = defineOfflinePayment(sequelize);
const Payout = definePayout(sequelize);
const Review = defineReview(sequelize);
const InstructorReview = defineInstructorReview(sequelize);
const UserReview = defineUserReview(sequelize);
const TutorReview = defineTutorReview(sequelize);
const LikeDislikeReview = defineLikeDislikeReview(sequelize);
const WatchHistory = defineWatchHistory(sequelize);
const WatchDuration = defineWatchDuration(sequelize);
const FrontendSetting = defineFrontendSetting(sequelize);
const Setting = defineSetting(sequelize);
const HomePageSetting = defineHomePageSetting(sequelize);
const PlayerSettings = definePlayerSettings(sequelize);
const SeoField = defineSeoField(sequelize);
const BuilderPage = defineBuilderPage(sequelize);
const Contact = defineContact(sequelize);
const Country = defineCountry(sequelize);
const Currency = defineCurrency(sequelize);
const Permission = definePermission(sequelize);
const Application = defineApplication(sequelize);
const TeamTrainingPackage = defineTeamTrainingPackage(sequelize);
const TeamPackagePurchase = defineTeamPackagePurchase(sequelize);
const TeamPackageMember = defineTeamPackageMember(sequelize);
const TutorCategory = defineTutorCategory(sequelize);
const TutorSubject = defineTutorSubject(sequelize);
const TutorCanTeach = defineTutorCanTeach(sequelize);
const TutorSchedule = defineTutorSchedule(sequelize);
const TutorBooking = defineTutorBooking(sequelize);

// ---------- Associations ----------
// Category self-reference
Category.hasMany(Category, { as: 'children', foreignKey: 'parent_id' });
Category.belongsTo(Category, { as: 'parent', foreignKey: 'parent_id' });

// Course ↔ User/Category
Course.belongsTo(User, { as: 'instructor', foreignKey: 'user_id' });
User.hasMany(Course, { as: 'courses', foreignKey: 'user_id' });
Course.belongsTo(Category, { as: 'category', foreignKey: 'category_id' });

// Course → Section → Lesson
Course.hasMany(Section, { as: 'sections', foreignKey: 'course_id' });
Section.belongsTo(Course, { foreignKey: 'course_id' });
Section.hasMany(Lesson, { as: 'lessons', foreignKey: 'section_id' });
Lesson.belongsTo(Section, { foreignKey: 'section_id' });
Course.hasMany(Lesson, { as: 'lessons', foreignKey: 'course_id' });
Lesson.belongsTo(Course, { foreignKey: 'course_id' });

// Quizzes
Course.hasMany(Quiz, { as: 'quizzes', foreignKey: 'course_id' });
Quiz.belongsTo(Course, { foreignKey: 'course_id' });
Quiz.belongsTo(Section, { foreignKey: 'section_id' });
Quiz.hasMany(Question, { as: 'questions', foreignKey: 'quiz_id' });
Question.belongsTo(Quiz, { foreignKey: 'quiz_id' });
Quiz.hasMany(QuizSubmission, { as: 'submissions', foreignKey: 'quiz_id' });
QuizSubmission.belongsTo(Quiz, { foreignKey: 'quiz_id' });
QuizSubmission.belongsTo(User, { foreignKey: 'user_id' });

// Enrollment
User.hasMany(Enrollment, { as: 'enrollments', foreignKey: 'user_id' });
Course.hasMany(Enrollment, { as: 'enrollments', foreignKey: 'course_id' });
Enrollment.belongsTo(User, { foreignKey: 'user_id' });
Enrollment.belongsTo(Course, { foreignKey: 'course_id' });

// Blog
Blog.belongsTo(BlogCategory, { as: 'category', foreignKey: 'category_id' });
BlogCategory.hasMany(Blog, { as: 'blogs', foreignKey: 'category_id' });
Blog.belongsTo(User, { as: 'author', foreignKey: 'user_id' });
Blog.hasMany(BlogComment, { as: 'comments', foreignKey: 'blog_id' });
BlogComment.belongsTo(Blog, { foreignKey: 'blog_id' });
BlogComment.belongsTo(User, { foreignKey: 'user_id' });
Blog.hasMany(BlogLike, { as: 'likes', foreignKey: 'blog_id' });
BlogLike.belongsTo(Blog, { foreignKey: 'blog_id' });

// Bootcamp
Bootcamp.belongsTo(BootcampCategory, { as: 'category', foreignKey: 'category_id' });
Bootcamp.belongsTo(User, { as: 'instructor', foreignKey: 'user_id' });
Bootcamp.hasMany(BootcampModule, { as: 'modules', foreignKey: 'bootcamp_id' });
BootcampModule.belongsTo(Bootcamp, { foreignKey: 'bootcamp_id' });
BootcampModule.hasMany(BootcampResource, { as: 'resources', foreignKey: 'module_id' });
BootcampResource.belongsTo(BootcampModule, { foreignKey: 'module_id' });
BootcampModule.hasMany(BootcampLiveClass, { as: 'liveClasses', foreignKey: 'module_id' });
BootcampLiveClass.belongsTo(BootcampModule, { foreignKey: 'module_id' });
Bootcamp.hasMany(BootcampPurchase, { as: 'purchases', foreignKey: 'bootcamp_id' });
BootcampPurchase.belongsTo(Bootcamp, { foreignKey: 'bootcamp_id' });
BootcampPurchase.belongsTo(User, { foreignKey: 'user_id' });

// Cart / Wishlist
CartItem.belongsTo(User, { foreignKey: 'user_id' });
CartItem.belongsTo(Course, { foreignKey: 'course_id' });
CartItem.belongsTo(Bootcamp, { foreignKey: 'bootcamp_id' });
Wishlist.belongsTo(User, { foreignKey: 'user_id' });
Wishlist.belongsTo(Course, { foreignKey: 'course_id' });
Wishlist.belongsTo(Bootcamp, { foreignKey: 'bootcamp_id' });
Addtocart.belongsTo(User, { foreignKey: 'user_id' });

// Knowledge Base
KnowledgeBase.hasMany(KnowledgeBaseTopick, { as: 'topics', foreignKey: 'knowledge_base_id' });
KnowledgeBaseTopick.belongsTo(KnowledgeBase, { as: 'knowledgeBase', foreignKey: 'knowledge_base_id' });

// Language
Language.hasMany(LanguagePhrase, { as: 'phrases', foreignKey: 'language_id' });
LanguagePhrase.belongsTo(Language, { foreignKey: 'language_id' });

// LiveClass
LiveClass.belongsTo(Course, { foreignKey: 'course_id' });
LiveClass.belongsTo(User, { as: 'host', foreignKey: 'user_id' });

// Messaging
MessageThread.hasMany(Message, { as: 'messages', foreignKey: 'thread_id' });
Message.belongsTo(MessageThread, { as: 'thread', foreignKey: 'thread_id' });
Message.belongsTo(User, { as: 'sender', foreignKey: 'sender_id' });
MessageThread.belongsTo(User, { as: 'sender', foreignKey: 'sender_id' });
MessageThread.belongsTo(User, { as: 'receiver', foreignKey: 'receiver_id' });

// Reviews
Review.belongsTo(User, { foreignKey: 'user_id' });
Review.belongsTo(Course, { foreignKey: 'course_id' });
Review.belongsTo(Bootcamp, { foreignKey: 'bootcamp_id' });
LikeDislikeReview.belongsTo(Review, { foreignKey: 'review_id' });
Review.hasMany(LikeDislikeReview, { as: 'reactions', foreignKey: 'review_id' });
InstructorReview.belongsTo(User, { as: 'reviewer', foreignKey: 'user_id' });
InstructorReview.belongsTo(User, { as: 'instructor', foreignKey: 'instructor_id' });
TutorReview.belongsTo(User, { as: 'reviewer', foreignKey: 'user_id' });
TutorReview.belongsTo(User, { as: 'tutor', foreignKey: 'tutor_id' });
UserReview.belongsTo(User, { as: 'reviewer', foreignKey: 'user_id' });
UserReview.belongsTo(User, { as: 'reviewee', foreignKey: 'reviewee_id' });

// Watch
WatchHistory.belongsTo(User, { foreignKey: 'user_id' });
WatchHistory.belongsTo(Course, { foreignKey: 'course_id' });
WatchHistory.belongsTo(Lesson, { foreignKey: 'lesson_id' });
WatchDuration.belongsTo(User, { foreignKey: 'user_id' });
WatchDuration.belongsTo(Course, { foreignKey: 'course_id' });
WatchDuration.belongsTo(Lesson, { foreignKey: 'lesson_id' });

// Certificates
Certificate.belongsTo(User, { foreignKey: 'user_id' });
Certificate.belongsTo(Course, { foreignKey: 'course_id' });
Certificate.belongsTo(Bootcamp, { foreignKey: 'bootcamp_id' });

// Forum
Forum.belongsTo(Course, { foreignKey: 'course_id' });
Forum.belongsTo(User, { foreignKey: 'user_id' });
Forum.hasMany(Forum, { as: 'replies', foreignKey: 'parent_id' });
Forum.belongsTo(Forum, { as: 'parent', foreignKey: 'parent_id' });

// Payments
PaymentHistory.belongsTo(User, { foreignKey: 'user_id' });
OfflinePayment.belongsTo(User, { foreignKey: 'user_id' });
Payout.belongsTo(User, { foreignKey: 'user_id' });

// Team Training
TeamTrainingPackage.belongsTo(Course, { foreignKey: 'course_id' });
TeamTrainingPackage.belongsTo(User, { foreignKey: 'user_id' });
TeamTrainingPackage.hasMany(TeamPackagePurchase, { as: 'purchases', foreignKey: 'package_id' });
TeamPackagePurchase.belongsTo(TeamTrainingPackage, { as: 'package', foreignKey: 'package_id' });
TeamPackagePurchase.belongsTo(User, { as: 'owner', foreignKey: 'user_id' });
TeamPackagePurchase.hasMany(TeamPackageMember, { as: 'members', foreignKey: 'purchase_id' });
TeamPackageMember.belongsTo(TeamPackagePurchase, { as: 'purchase', foreignKey: 'purchase_id' });
TeamPackageMember.belongsTo(User, { foreignKey: 'user_id' });

// Tutor
TutorCategory.hasMany(TutorSubject, { as: 'subjects', foreignKey: 'category_id' });
TutorSubject.belongsTo(TutorCategory, { as: 'category', foreignKey: 'category_id' });
TutorCanTeach.belongsTo(User, { as: 'tutor', foreignKey: 'tutor_id' });
TutorCanTeach.belongsTo(TutorSubject, { foreignKey: 'subject_id' });
TutorSchedule.belongsTo(User, { as: 'tutor', foreignKey: 'tutor_id' });
TutorSchedule.belongsTo(TutorBooking, { as: 'booking', foreignKey: 'booking_id' });
TutorBooking.belongsTo(User, { as: 'tutor', foreignKey: 'tutor_id' });
TutorBooking.belongsTo(User, { as: 'student', foreignKey: 'student_id' });
TutorBooking.belongsTo(TutorSubject, { as: 'subject', foreignKey: 'subject_id' });
TutorBooking.hasMany(TutorSchedule, { as: 'schedules', foreignKey: 'booking_id' });

// Device / Auth
DeviceIp.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(DeviceIp, { as: 'devices', foreignKey: 'user_id' });

module.exports = {
  sequelize,
  User,
  PasswordResetToken,
  DeviceIp,
  Category,
  Course,
  Section,
  Lesson,
  Enrollment,
  Quiz,
  Question,
  QuizSubmission,
  Blog,
  BlogCategory,
  BlogComment,
  BlogLike,
  Bootcamp,
  BootcampCategory,
  BootcampModule,
  BootcampPurchase,
  BootcampResource,
  BootcampLiveClass,
  CartItem,
  Addtocart,
  Wishlist,
  Coupon,
  Certificate,
  Forum,
  KnowledgeBase,
  KnowledgeBaseTopick,
  Language,
  LanguagePhrase,
  LiveClass,
  MediaFile,
  Message,
  MessageThread,
  Newsletter,
  NewsletterSubscriber,
  NotificationSetting,
  Notification,
  PaymentGateway,
  PaymentHistory,
  OfflinePayment,
  Payout,
  Review,
  InstructorReview,
  UserReview,
  TutorReview,
  LikeDislikeReview,
  WatchHistory,
  WatchDuration,
  FrontendSetting,
  Setting,
  HomePageSetting,
  PlayerSettings,
  SeoField,
  BuilderPage,
  Contact,
  Country,
  Currency,
  Permission,
  Application,
  TeamTrainingPackage,
  TeamPackagePurchase,
  TeamPackageMember,
  TutorCategory,
  TutorSubject,
  TutorCanTeach,
  TutorSchedule,
  TutorBooking,
};
