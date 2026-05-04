const sequelize = require('../config/database');

const Category = require('./Category')(sequelize);
const Course = require('./Course')(sequelize);
const SeoField = require('./SeoField')(sequelize);
const User = require('./User')(sequelize);
const Lesson = require('./Lesson')(sequelize);
const Section = require('./Section')(sequelize);
const Question = require('./Question')(sequelize);
const QuizSubmission = require('./QuizSubmission')(sequelize);
const Setting = require('./Setting')(sequelize);
const LiveClass = require('./LiveClass')(sequelize);
const Coupon = require('./Coupon')(sequelize);
const Certificate = require('./Certificate')(sequelize);
const PreAssessmentResult = require('./PreAssessmentResult')(sequelize);
const UserProgress = require('./UserProgress')(sequelize);
const LessonCompletion = require('./LessonCompletion')(sequelize);
const LessonWatchProgress = require('./LessonWatchProgress')(sequelize);

const models = { Category, Course, SeoField, User, Lesson, Section, Question, QuizSubmission, Setting, LiveClass, Coupon, Certificate, PreAssessmentResult, UserProgress, LessonCompletion, LessonWatchProgress };
Object.values(models).forEach((m) => m.associate && m.associate(models));

module.exports = { sequelize, ...models };
