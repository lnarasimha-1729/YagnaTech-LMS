const { QueryTypes } = require('sequelize');
const authDb = require('../config/authDatabase');
const { Certificate, UserProgress, Course, Lesson, Batch, Program, sequelize } = require('../models');
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

    // Resolve the display name so the dashboard can filter the read-only
    // student list by clgName (which is what listStudents matches on).
    const [collegeRow] = await authDb.query(
        `SELECT clgName FROM colleges WHERE LOWER(TRIM(clgId)) = LOWER(:filter) LIMIT 1`,
        { replacements: { filter }, type: QueryTypes.SELECT }
    );
    const collegeName = collegeRow?.clgName || null;

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
        college_name: collegeName,
        total_students: totalStudents,
        pre_assessment_attempts: preAttempts,
        active_learners: activeLearners,
        post_assessment_attempts: postAttempts,
        certified_graduates: certifiedGraduates,
    };
};

// Courses the root admin assigned to this college (courses.clg_ids contains the
// clgId). Returns each course with its lesson count and the number of THIS
// college's students enrolled in it. Read-only — the college admin can't edit
// courses (root admin owns them).
const getCoursesForCollege = async ({ collegeId }) => {
    if (!collegeId) {
        throw new HttpError(400, 'College admin profile is missing a college_id');
    }
    const filter = String(collegeId).trim();

    // Courses assigned to this college. clg_ids is a JSON array of clgId strings;
    // JSON_CONTAINS matches when the array holds the (JSON-encoded) clgId.
    const clgJson = sequelize.escape(JSON.stringify(filter));
    const courses = await Course.findAll({
        where: sequelize.literal(`JSON_CONTAINS(\`Course\`.\`clg_ids\`, ${clgJson})`),
        attributes: ['id', 'title', 'status', 'batch_ids'],
        order: [['id', 'DESC']],
        raw: true,
    });
    if (!courses.length) return [];

    const courseIds = courses.map((c) => c.id);

    // Resolve batch ids -> names. Match clg_id case/whitespace-insensitively
    // (same drift we guard against for students) so the names resolve even when
    // the batch's clg_id casing differs from the JWT's college_id. Falling back
    // to ALL batches referenced by these courses guarantees we never show a raw
    // id: we look names up by id across the full batch set, then prefer the
    // college's own batches for scoping.
    const courseBatchIds = Array.from(new Set(
        courses.flatMap((c) => (Array.isArray(c.batch_ids) ? c.batch_ids : []))
            .map((id) => Number(id))
            .filter((n) => Number.isFinite(n))
    ));
    const batchRows = courseBatchIds.length
        ? await Batch.findAll({ where: { id: courseBatchIds }, attributes: ['id', 'name', 'clg_id'], raw: true })
        : [];
    const batchNameById = Object.fromEntries(batchRows.map((b) => [String(b.id), b.name]));
    // Which of those batches belong to this college (case/space-insensitive)?
    const norm = (v) => String(v ?? '').trim().toLowerCase();
    const collegeBatchIds = new Set(
        batchRows.filter((b) => norm(b.clg_id) === norm(filter)).map((b) => String(b.id))
    );

    // Lessons per course.
    const lessonCounts = await Lesson.findAll({
        where: { course_id: courseIds },
        attributes: ['course_id', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
        group: ['course_id'],
        raw: true,
    });
    const lessonsByCourse = Object.fromEntries(
        lessonCounts.map((r) => [r.course_id, Number(r.count) || 0])
    );

    // Enrolled count scoped to THIS college's students. Pull the college's
    // student userIds from auth-service, then count enrolled UserProgress rows
    // per course for that set only.
    const students = await authDb.query(
        `SELECT u.userId
           FROM users u
           JOIN roles r ON r.roleId = u.roleId
          WHERE LOWER(TRIM(u.collegeId)) = LOWER(:filter)
            AND r.role = 'student'`,
        { replacements: { filter }, type: QueryTypes.SELECT }
    );
    const userIds = students.map((s) => String(s.userId)).filter(Boolean);

    let enrolledByCourse = {};
    if (userIds.length) {
        const enrolledRows = await UserProgress.findAll({
            where: { user_id: userIds, course_id: courseIds, enrolled: true },
            attributes: ['course_id', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
            group: ['course_id'],
            raw: true,
        });
        enrolledByCourse = Object.fromEntries(
            enrolledRows.map((r) => [r.course_id, Number(r.count) || 0])
        );
    }

    return courses.map((c) => {
        const batchIds = (Array.isArray(c.batch_ids) ? c.batch_ids : []).map((id) => String(id));
        // Prefer batches that belong to this college; if none match the college
        // scope (e.g. clg_id drift), fall back to all of the course's batches so
        // the admin still sees NAMES, never raw ids.
        const scoped = batchIds.filter((id) => collegeBatchIds.has(id));
        const useIds = scoped.length ? scoped : batchIds;
        const batches = useIds
            .map((id) => batchNameById[id])   // resolve id -> name
            .filter(Boolean);                  // drop any unresolved (never show a number)
        return {
            id: c.id,
            title: c.title,
            status: c.status,
            lesson_count: lessonsByCourse[c.id] || 0,
            enrolled: enrolledByCourse[c.id] || 0,
            batches, // array of batch NAMES assigned to this course
        };
    });
};

// Programs the root admin assigned to this college (programs.clg_ids contains
// the clgId). Returns each program with its bundled course NAMES and batch
// NAMES (scoped to this college), plus enrolled count of THIS college's
// students. Read-only.
const getProgramsForCollege = async ({ collegeId }) => {
    if (!collegeId) {
        throw new HttpError(400, 'College admin profile is missing a college_id');
    }
    const filter = String(collegeId).trim();
    const norm = (v) => String(v ?? '').trim().toLowerCase();

    const clgJson = sequelize.escape(JSON.stringify(filter));
    const programs = await Program.findAll({
        where: sequelize.literal(`JSON_CONTAINS(\`Program\`.\`clg_ids\`, ${clgJson})`),
        attributes: ['id', 'title', 'is_active', 'course_id', 'course_ids', 'batch_ids'],
        order: [['id', 'DESC']],
        raw: true,
    });
    if (!programs.length) return [];

    // Collect all course ids + batch ids referenced across these programs.
    const allCourseIds = Array.from(new Set(
        programs.flatMap((p) => {
            const ids = Array.isArray(p.course_ids) && p.course_ids.length ? p.course_ids : (p.course_id ? [p.course_id] : []);
            return ids;
        }).map((id) => Number(id)).filter((n) => Number.isFinite(n))
    ));
    const allBatchIds = Array.from(new Set(
        programs.flatMap((p) => (Array.isArray(p.batch_ids) ? p.batch_ids : []))
            .map((id) => Number(id)).filter((n) => Number.isFinite(n))
    ));

    // Resolve course ids -> titles.
    const courseRows = allCourseIds.length
        ? await Course.findAll({ where: { id: allCourseIds }, attributes: ['id', 'title'], raw: true })
        : [];
    const courseTitleById = Object.fromEntries(courseRows.map((c) => [String(c.id), c.title]));

    // Resolve batch ids -> names, and note which belong to this college.
    const batchRows = allBatchIds.length
        ? await Batch.findAll({ where: { id: allBatchIds }, attributes: ['id', 'name', 'clg_id'], raw: true })
        : [];
    const batchNameById = Object.fromEntries(batchRows.map((b) => [String(b.id), b.name]));
    const collegeBatchIds = new Set(
        batchRows.filter((b) => norm(b.clg_id) === norm(filter)).map((b) => String(b.id))
    );

    // Enrolled count per program, scoped to this college's students.
    const students = await authDb.query(
        `SELECT u.userId
           FROM users u
           JOIN roles r ON r.roleId = u.roleId
          WHERE LOWER(TRIM(u.collegeId)) = LOWER(:filter)
            AND r.role = 'student'`,
        { replacements: { filter }, type: QueryTypes.SELECT }
    );
    const userIds = students.map((s) => String(s.userId)).filter(Boolean);
    let enrolledByProgram = {};
    if (userIds.length) {
        const programIds = programs.map((p) => p.id);
        const rows = await UserProgress.findAll({
            where: { user_id: userIds, program_id: programIds, enrolled: true },
            attributes: ['program_id', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
            group: ['program_id'],
            raw: true,
        });
        enrolledByProgram = Object.fromEntries(rows.map((r) => [r.program_id, Number(r.count) || 0]));
    }

    return programs.map((p) => {
        const courseIds = (Array.isArray(p.course_ids) && p.course_ids.length ? p.course_ids : (p.course_id ? [p.course_id] : [])).map((id) => String(id));
        const courses = courseIds.map((id) => courseTitleById[id]).filter(Boolean);

        const batchIds = (Array.isArray(p.batch_ids) ? p.batch_ids : []).map((id) => String(id));
        const scoped = batchIds.filter((id) => collegeBatchIds.has(id));
        const useIds = scoped.length ? scoped : batchIds;
        const batches = useIds.map((id) => batchNameById[id]).filter(Boolean);

        return {
            id: p.id,
            title: p.title,
            status: p.is_active === false ? 'inactive' : 'active',
            courses,  // array of course NAMES bundled in this program
            batches,  // array of batch NAMES assigned to this program
            enrolled: enrolledByProgram[p.id] || 0,
        };
    });
};

module.exports = { getStats, getCoursesForCollege, getProgramsForCollege };
