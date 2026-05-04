const dashRepo = require('../repositories/DashboardRepository');

const stats = async () => {
    // enrollment_count source: this app records course enrolment in
    // `user_progress.enrolled = 1`, not in a separate `enrollments` table
    // (which doesn't exist in this schema — the legacy query against it was
    // silently returning 0). Counting user_progress matches how the College
    // Admin dashboard interprets the same data, so the two dashboards stay
    // consistent.
    const [course_count, lesson_count, enrollment_count, student_count] = await Promise.all([
        dashRepo.safeCount('courses'),
        dashRepo.safeCount('lessons'),
        dashRepo.safeCount('user_progress', 'enrolled = 1'),
        dashRepo.safeCount('users', "role = 'student'"),
    ]);

    const status_counts = { active: 0, upcoming: 0, pending: 0, private: 0, draft: 0, inactive: 0 };
    try {
        const courses = await dashRepo.courseStatuses();
        courses.forEach((c) => {
            if (status_counts[c.status] !== undefined) status_counts[c.status]++;
        });
    } catch (err) {
        console.warn('[dashboard] status query failed:', err.message);
    }

    return {
        stats: { course_count, lesson_count, enrollment_count, student_count },
        status_counts,
    };
};

module.exports = { stats };
