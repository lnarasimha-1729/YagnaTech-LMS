const { CourseReview, Course, Lesson } = require('../models');
const { fn, col } = require('sequelize');
const watchStore = require('./watchStore');

// True when the student has completed every lesson of the course. Mirrors the
// /api/public/course-progress completion math: count the course's lessons and
// compare against the student's completed_lesson set in the watch store.
const hasCompletedCourse = async (courseId, userId) => {
    const total = await Lesson.count({ where: { course_id: courseId } });
    if (!total) return false; // a course with no lessons can't be "completed"
    const history = watchStore.getHistory(courseId, Number(userId) || userId);
    const done = (history?.completed_lesson || []).length;
    return done >= total;
};

// Recompute courses.average_rating from the live course_reviews rows so the
// cached value the course-details payload reads stays in sync after each write.
const refreshCourseAverage = async (courseId) => {
    const row = await CourseReview.findOne({
        where: { course_id: courseId },
        attributes: [[fn('AVG', col('rating')), 'avg']],
        raw: true,
    });
    const avg = Number(row?.avg) || 0;
    await Course.update({ average_rating: avg }, { where: { id: courseId } });
    return avg;
};

// The current student's review for a course, or null. Used to pre-fill the Rate
// tab and to flip it into the read-only "already rated" state.
const getMyReview = async (courseId, userId) => {
    if (!userId) return null;
    const row = await CourseReview.findOne({
        where: { course_id: courseId, user_id: String(userId) },
    });
    return row ? row.toJSON() : null;
};

// All reviews for a course (newest first) plus the aggregate the course-details
// page renders. Shaped to match what CourseDetails.jsx's Reviews expects:
// { name, rating, review, created_at }.
const listForCourse = async (courseId) => {
    const rows = await CourseReview.findAll({
        where: { course_id: courseId },
        order: [['created_at', 'DESC']],
    });
    const reviews = rows.map((r) => {
        const name = r.user_name || 'Student';
        return {
            id: r.id,
            // Flat name for the admin Rate tab; nested user{} for the public
            // course-details review card (it reads r.user?.name / r.user?.photo).
            name,
            user: { name, photo: null },
            rating: r.rating,
            review: r.review || '',
            created_at: r.created_at,
        };
    });
    const count = reviews.length;
    const average = count
        ? reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / count
        : 0;
    return { reviews, review_count: count, average_rating: average };
};

// Submit a one-time rating. Throws { status, message } on the guarded paths so
// the caller can map them to HTTP codes:
//   401 — no student id
//   404 — course not found
//   403 — course not completed
//   409 — student already rated this course
const submit = async ({ courseId, userId, userName, rating, review }) => {
    if (!userId) throw { status: 401, message: 'You must be signed in to rate this course.' };

    const r = Number(rating);
    if (!Number.isInteger(r) || r < 1 || r > 5) {
        throw { status: 422, message: 'Rating must be a whole number from 1 to 5.' };
    }

    const course = await Course.findByPk(courseId);
    if (!course) throw { status: 404, message: 'Course not found.' };

    const existing = await CourseReview.findOne({
        where: { course_id: courseId, user_id: String(userId) },
    });
    if (existing) throw { status: 409, message: 'You have already rated this course.' };

    if (!(await hasCompletedCourse(courseId, userId))) {
        throw { status: 403, message: 'Finish the course before rating it.' };
    }

    const created = await CourseReview.create({
        course_id: courseId,
        user_id: String(userId),
        user_name: userName || null,
        rating: r,
        review: review ? String(review).trim() : null,
    });

    await refreshCourseAverage(courseId);
    return created.toJSON();
};

module.exports = { hasCompletedCourse, getMyReview, listForCourse, submit, refreshCourseAverage };
