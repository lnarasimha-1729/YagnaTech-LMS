const { UserProgress, Course, Lesson, Section } = require('../models');
const { asyncHandler } = require('../middlewares/error');

// All endpoints accept user_id in the body/query as a fallback because the
// student JWT lives in an httpOnly cookie on a different service. When proper
// auth is wired here, prefer req.user.id.
const resolveUserId = (req) =>
    Number(req.user?.id || req.body?.user_id || req.query?.user_id || 0);

// Returns the user's first enrolled program-course pair, plus the slug + a
// sensible lesson_id to redirect to. `null` means "user has not enrolled yet".
const buildPlayerTarget = async (row) => {
    if (!row || !row.course_id || !row.enrolled) return null;
    const course = await Course.findByPk(row.course_id, { attributes: ['id', 'slug', 'title'] });
    if (!course) return null;

    let lessonId = row.last_lesson_id;
    if (!lessonId) {
        // Fall back to the first lesson, ordered by its section's sort then the lesson's sort.
        const firstSection = await Section.findOne({
            where: { course_id: course.id },
            order: [['sort', 'ASC']],
        });
        if (firstSection) {
            const firstLesson = await Lesson.findOne({
                where: { section_id: firstSection.id },
                order: [['sort', 'ASC']],
            });
            if (firstLesson) lessonId = firstLesson.id;
        }
    }
    return {
        program_id: row.program_id,
        course_id: course.id,
        course_slug: course.slug,
        last_lesson_id: lessonId,
        enrolled: true,
        player_path: `/courses/programs/course-details/play/${course.slug}/${lessonId || ''}`,
    };
};

// POST /api/user-progress/select-program
// body: { user_id?, program_id, course_id }
// Creates or updates the (user, program) row. Course is recorded but enrollment
// is not yet flipped on — that happens at /enroll-course.
exports.selectProgram = asyncHandler(async (req, res) => {
    const userId = resolveUserId(req);
    const programId = Number(req.body.program_id);
    const courseId = req.body.course_id != null ? Number(req.body.course_id) : null;
    if (!userId || !programId) {
        return res.status(422).json({ error: 'user_id and program_id are required' });
    }

    const where = { user_id: userId, program_id: programId };
    let row = await UserProgress.findOne({ where });
    if (row) {
        await row.update({ course_id: courseId ?? row.course_id });
    } else {
        row = await UserProgress.create({ ...where, course_id: courseId, enrolled: false });
    }
    res.json({ row, target: await buildPlayerTarget(row) });
});

// POST /api/user-progress/enroll-course
// body: { user_id?, program_id, course_id }
// Flips enrolled=true and locks in the course. Idempotent.
exports.enrollCourse = asyncHandler(async (req, res) => {
    const userId = resolveUserId(req);
    const programId = Number(req.body.program_id);
    const courseId = Number(req.body.course_id);
    if (!userId || !programId || !courseId) {
        return res.status(422).json({ error: 'user_id, program_id, and course_id are required' });
    }

    const where = { user_id: userId, program_id: programId };
    let row = await UserProgress.findOne({ where });
    if (row) {
        await row.update({ course_id: courseId, enrolled: true });
    } else {
        row = await UserProgress.create({ ...where, course_id: courseId, enrolled: true });
    }
    res.json({ row, target: await buildPlayerTarget(row) });
});

// GET /api/user-progress?user_id=...
// Returns the user's enrollments. Frontend uses `target` to decide whether to
// skip the selection screens and go straight to the player.
exports.getProgress = asyncHandler(async (req, res) => {
    const userId = resolveUserId(req);
    if (!userId) return res.status(422).json({ error: 'user_id is required' });

    const rows = await UserProgress.findAll({
        where: { user_id: userId },
        order: [['updated_at', 'DESC']],
    });
    const enrolled = rows.find((r) => r.enrolled && r.course_id);
    return res.json({
        rows,
        target: enrolled ? await buildPlayerTarget(enrolled) : null,
    });
});

// PATCH /api/user-progress/last-lesson
// body: { user_id?, course_id, lesson_id }
// Bumped by the player as the user watches, so revisits land on the most recent lesson.
exports.updateLastLesson = asyncHandler(async (req, res) => {
    const userId = resolveUserId(req);
    const courseId = Number(req.body.course_id);
    const lessonId = Number(req.body.lesson_id);
    if (!userId || !courseId || !lessonId) {
        return res.status(422).json({ error: 'user_id, course_id, and lesson_id are required' });
    }
    const row = await UserProgress.findOne({ where: { user_id: userId, course_id: courseId } });
    if (!row) return res.json({ row: null });
    await row.update({ last_lesson_id: lessonId });
    res.json({ row });
});
