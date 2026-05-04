const { QueryTypes } = require('sequelize');
const authDb = require('../config/authDatabase');
const { Certificate, UserProgress } = require('../models');
const { HttpError } = require('../middlewares/error');

/**
 * Aggregated KPIs for the College Admin dashboard, scoped to one college.
 *
 * Cross-DB strategy:
 *   - Student profile, college mapping, pre/post scores live in `lucy_devdb`
 *     (auth-service). We query that via the `authDb` Sequelize handle.
 *   - Enrollments live in `lms_admin.user_progress` (admin-service's own DB).
 *   - Certificates live in `lms_admin.certificates`.
 *
 * Both sets of users key on auth-service's `userId` string, so we filter
 * lms_admin tables with the user-id list pulled from auth-service.
 */

const getStats = async ({ collegeId }) => {
    if (!collegeId) {
        throw new HttpError(400, 'College admin profile is missing a college_id');
    }

    // Trim and case-normalize the JWT value defensively. We've seen mismatches
    // caused by leading spaces in the admin-service users.college_id column or
    // by case drift between admin signup and student signup ("COLLEGE001" vs
    // "college001"). The auth-service users.collegeId column is collation
    // utf8mb4_unicode_ci by default, so a TRIM + LOWER comparison is safe.
    const filter = String(collegeId).trim();

    // 1. All student users in the caller's college, plus their pre/post scores.
    //    role join is needed because roles.role enum holds the human label.
    //    LOWER+TRIM both sides so admin/student college_id casing/whitespace
    //    drift doesn't silently zero the dashboard.
    const students = await authDb.query(
        `SELECT u.userId, u.collegeId, u.preScore, u.postScore
           FROM users u
           JOIN roles r ON r.roleId = u.roleId
          WHERE LOWER(TRIM(u.collegeId)) = LOWER(:filter)
            AND r.role = 'student'`,
        { replacements: { filter }, type: QueryTypes.SELECT }
    );

    const totalStudents = students.length;
    const preAttempts = students.filter((s) => s.preScore !== null && s.preScore !== undefined).length;
    const postAttempts = students.filter((s) => s.postScore !== null && s.postScore !== undefined).length;

    // 2. Active learners — students with at least one enrolled UserProgress row.
    //    UserProgress.user_id is BIGINT; auth-service issues numeric strings, so
    //    cast both ends defensively.
    const userIds = students.map((s) => String(s.userId)).filter(Boolean);
    let activeLearners = 0;
    let certifiedGraduates = 0;

    if (userIds.length) {
        const enrolled = await UserProgress.findAll({
            where: { user_id: userIds, enrolled: true },
            attributes: ['user_id'],
            group: ['user_id'],
            raw: true,
        });
        activeLearners = enrolled.length;

        // 3. Certified graduates — distinct user_id with a Certificate row.
        const certified = await Certificate.findAll({
            where: { user_id: userIds },
            attributes: ['user_id'],
            group: ['user_id'],
            raw: true,
        });
        certifiedGraduates = certified.length;
    }

    return {
        college_id: collegeId,
        total_students: totalStudents,
        pre_assessment_attempts: preAttempts,
        active_learners: activeLearners,
        post_assessment_attempts: postAttempts,
        certified_graduates: certifiedGraduates,
    };
};

module.exports = { getStats };
