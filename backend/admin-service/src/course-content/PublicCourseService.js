const courseRepo = require('../repositories/CourseRepository');
const sectionRepo = require('../repositories/SectionRepository');
const lessonRepo = require('../repositories/LessonRepository');
const questionRepo = require('../repositories/QuestionRepository');
const quizSubmissionRepo = require('../repositories/QuizSubmissionRepository');
const { User, Course, BatchMember, Lesson, LessonCompletion, UserProgress } = require('../models');
const watchStore = require('./watchStore');
const reviewService = require('./ReviewService');
const { QueryTypes } = require('sequelize');
const authDb = require('../config/authDatabase');
const env = require('../config/env');

// Build an absolute URL for an uploaded asset path served by this service's
// /uploads static mount. CourseDetails.jsx renders <img src={creator.photo}>
// directly with no base prefix, so the API must return a fully qualified URL.
const absoluteUpload = (relPath) => {
    if (!relPath) return null;
    const base = String(env.appUrl || '').replace(/\/+$/, '');
    const clean = String(relPath).replace(/^\/+/, '');
    return `${base}/${clean}`;
};

// Like absoluteUpload but leaves already-absolute URLs untouched. Course
// media (thumbnail/banner/preview) is usually a relative uploads/... path the
// /uploads static mount serves, but `preview` can also be an external link
// (CourseService stores b.preview_link verbatim). Prefixing those would break
// them, so pass http(s):// and protocol-relative values through unchanged.
const absoluteMedia = (val) => {
    if (!val) return '';
    return /^(https?:)?\/\//i.test(String(val)) ? String(val) : absoluteUpload(val);
};

const safeJSON = (raw, fallback) => {
    if (raw == null) return fallback;
    if (typeof raw !== 'string') return raw;
    try { return JSON.parse(raw); } catch { return fallback; }
};

// The admin curriculum stores quiz questions in their own `questions` table
// (QuizService.buildQuestionData): { title, type, options(JSON string),
// answer(JSON string|raw) }. The student QuizPlayer renders the SAME data the
// admin entered, so we normalise each row to a stable shape it can consume:
//   { q, type, options:[...], answer }
// where `answer` is the 0-based option index for mcq/true_false (so scoring is
// a simple equality check) and the raw expected text(s) for fill_blanks.
const normalizeQuizQuestion = (row) => {
    const r = row.toJSON ? row.toJSON() : row;
    const options = safeJSON(r.options, []);
    let answer;
    if (r.type === 'true_false') {
        // options rendered as ['True','False']; map stored "true"/"false".
        answer = String(r.answer).toLowerCase() === 'true' ? 0 : 1;
        return { id: r.id, q: r.title, type: r.type, options: ['True', 'False'], answer };
    }
    if (r.type === 'fill_blanks') {
        // No options; keep accepted answer(s) as a lowercased string list.
        const accepted = safeJSON(r.answer, [r.answer]).map((a) => String(a).trim().toLowerCase());
        return { id: r.id, q: r.title, type: r.type, options: [], answer: accepted };
    }
    // mcq (default): stored answer is a JSON array of correct option *values*.
    const correctVals = safeJSON(r.answer, []);
    const idx = options.findIndex((opt) => correctVals.includes(opt));
    return { id: r.id, q: r.title, type: 'mcq', options, answer: idx };
};

const sumLessonSeconds = (lessons) =>
    lessons.reduce((sum, l) => {
        const dur = l.duration || '00:00:00';
        const [h, m, s] = String(dur).split(':').map((x) => Number(x) || 0);
        return sum + (h || 0) * 3600 + (m || 0) * 60 + (s || 0);
    }, 0);

// Look up a single auth-service user by userId and shape it for the course
// detail page. No role filter — the assigned id was set by the admin via the
// instructor dropdown, so we trust it; filtering by `role='instructor'` here
// caused legitimate assignments to silently fall through when the role
// column's casing didn't match. Returns null when the id doesn't resolve.
const fetchAuthUser = async (userId) => {
    if (!userId) return null;
    try {
        const rows = await authDb.query(
            `SELECT u.userId AS id, u.name, u.email,
                    u.expertise, u.bio, u.linkedinUrl,
                    u.facebookUrl, u.twitterUrl, u.instructorPhoto
               FROM users u
              WHERE u.userId = :id
              LIMIT 1`,
            { replacements: { id: String(userId).trim() }, type: QueryTypes.SELECT }
        );
        if (!rows.length) return null;
        const u = rows[0];
        const photo = u.instructorPhoto
            ? absoluteUpload(u.instructorPhoto)
            : `https://i.pravatar.cc/200?u=${u.id}`;
        return {
            id: u.id,
            name: u.name,
            email: u.email,
            photo,
            about: u.expertise || '',
            biography: u.bio || '',
            skills: u.expertise || '',
            linkedinUrl: u.linkedinUrl || '',
            facebookUrl: u.facebookUrl || '',
            twitterUrl: u.twitterUrl || '',
        };
    } catch (err) {
        console.warn('[course] auth user lookup failed:', err.message);
        return null;
    }
};

// Resolve the instructor the admin assigned to a course. Walks every id in
// course.instructor_ids (not just [0]) so a stale/deleted first id doesn't
// block a valid later one. Only falls back to the admin-creator (course.user_id)
// as an absolute last resort, and logs the fact so it's obvious in dev when a
// course has no real instructor attached.
const resolveInstructor = async (course) => {
    const raw = safeJSON(course.instructor_ids, []);
    const ids = (Array.isArray(raw) ? raw : [raw])
        .map((v) => (v == null ? '' : String(v).trim()))
        .filter(Boolean);

    for (const id of ids) {
        const found = await fetchAuthUser(id);
        if (found && found.name) return found;
    }

    // Last-resort fallback: the course has no usable assignment. This is the
    // path that historically showed the admin-creator's name instead of the
    // real teacher — log so it's visible in dev.
    if (course.user_id) {
        console.warn(
            `[course] no assignable instructor on course ${course.id} ` +
            `(instructor_ids=${JSON.stringify(course.instructor_ids)}); ` +
            `falling back to creator user_id=${course.user_id}`
        );
        // Try the auth DB first (handles the case where the creator IS an
        // instructor account); fall back to the local admin User only when
        // that also misses.
        const fromAuth = await fetchAuthUser(course.user_id);
        if (fromAuth && fromAuth.name) return fromAuth;
        const creator = await User.findByPk(course.user_id);
        if (creator) {
            return {
                id: creator.id,
                name: creator.name,
                email: creator.email,
                photo: creator.photo || `https://i.pravatar.cc/200?u=${creator.id}`,
                about: creator.about || '',
                biography: creator.biography || '',
                skills: creator.skills || '',
                linkedinUrl: creator.linkedin || '',
                facebookUrl: creator.facebook || '',
                twitterUrl: creator.twitter || '',
            };
        }
    }
    return null;
};

const sanitizeCourse = (course, sections = [], lessons = [], creator = null) => {
    const c = course.toJSON ? course.toJSON() : { ...course };
    const lessonsBySection = sections.reduce((acc, sec) => {
        acc[sec.id] = lessons.filter((l) => l.section_id === sec.id);
        return acc;
    }, {});

    const sectionPayload = sections.map((s) => ({
        id: s.id,
        title: s.title,
        sort: s.sort,
        lessons: (lessonsBySection[s.id] || []).map((l) => ({
            id: l.id,
            title: l.title,
            duration: l.duration || '00:00:00',
            lesson_type: l.lesson_type,
            is_free: l.is_free || 0,
        })),
    }));

    return {
        id: c.id,
        user_id: c.user_id,
        category_id: c.category_id,
        title: c.title,
        slug: c.slug,
        short_description: c.short_description || '',
        description: c.description || '',
        requirements: c.requirements || '[]',
        outcomes: c.outcomes || '[]',
        faqs: c.faqs || '[]',
        language: c.language || 'english',
        level: c.level || 'beginner',
        is_paid: c.is_paid ?? 0,
        price: Number(c.price || 0),
        discount_flag: c.discount_flag || 0,
        discounted_price: Number(c.discounted_price || 0),
        // Months of access after enrolment; NULL means lifetime. Surfaced on
        // the public course-details "This course includes" line so students
        // see the real expiry the admin set in the Pricing tab.
        expiry_period: c.expiry_period == null ? null : Number(c.expiry_period),
        thumbnail: absoluteMedia(c.thumbnail),
        banner: absoluteMedia(c.banner || c.thumbnail),
        preview: absoluteMedia(c.preview),
        status: c.status,
        // Default to true when the column is missing so older rows keep the
        // pre-toggle behaviour ("Certificate Course" always shown).
        has_certificate: c.has_certificate === undefined || c.has_certificate === null
            ? true
            : !!c.has_certificate,
        enrolled: 0,
        review_count: 0,
        // Real admin-set value from the courses table (Course model has an
        // average_rating column). Was hardcoded to 0, which made the detail
        // page always show a 0 rating regardless of what the admin entered.
        average_rating: Number(c.average_rating || 0),
        section_count: sections.length,
        lesson_count: lessons.length,
        total_duration_secs: sumLessonSeconds(lessons),
        sections: sectionPayload,
        // creator is the already-shaped object returned by resolveInstructor
        // (assigned-instructor first, legacy course.user_id fallback). It
        // matches the {id,name,email,photo,about,biography,skills} shape the
        // student CourseDetails page expects, so we pass it through.
        creator: creator || null,
    };
};

const list = async (query = {}) => {
    const limit = 12;
    const page = Number(query.page) || 1;
    const offset = (page - 1) * limit;

    const where = { status: 'active' };

    // Course grouping is now exclusively by college. `clgId` (the logged-in
    // student's college) is required: without it we return an empty list
    // flagged `no_college` so the UI can prompt for a college binding. Any
    // legacy `category_id` query param is intentionally ignored.
    const clgId = typeof query.clgId === 'string' ? query.clgId.trim() : '';
    if (!clgId) {
        return {
            data: [],
            total: 0,
            per_page: limit,
            current_page: page,
            last_page: 1,
            categories: [],
            no_college: true,
        };
    }
    const escapedClgId = Course.sequelize.escape(JSON.stringify(clgId));
    where[require('sequelize').Op.and] = [
        Course.sequelize.literal(`JSON_CONTAINS(clg_ids, ${escapedClgId})`),
    ];

    const { count, rows } = await Course.findAndCountAll({
        where,
        order: [['id', 'DESC']],
        limit,
        offset,
    });

    // Strict student-scope gate: when user_id is supplied, only courses
    // whose batch_ids overlap one of the student's batches surface. The
    // admin links every course to specific batches, so unscoped courses
    // and courses missed by the student's memberships must NOT leak through.
    // Anonymous callers (no user_id) still get the college-only result —
    // they're public catalog browsers, not enrolled students.
    const userIdRaw = query.user_id;
    let filteredRows = rows;
    if (userIdRaw) {
        const memberRows = await BatchMember.findAll({
            where: { user_id: String(userIdRaw) },
            attributes: ['batch_id'],
            raw: true,
        }).catch(() => []);
        const studentBatchIds = new Set(
            memberRows.map((r) => Number(r.batch_id)).filter((n) => Number.isFinite(n))
        );
        if (studentBatchIds.size === 0) {
            filteredRows = [];
        } else {
            filteredRows = rows.filter((r) => {
                const cb = Array.isArray(r.batch_ids) ? r.batch_ids : [];
                if (cb.length === 0) return false;
                return cb.some((id) => studentBatchIds.has(Number(id)));
            });
        }
    }

    // Per-course progress hydration for the signed-in student. We batch two
    // cheap aggregate queries (lesson count per course, completion count per
    // course for this user) so the card list can render a progress bar without
    // each card refetching the player payload.
    const progressByCourse = new Map();
    const uidNum = Number(userIdRaw);
    if (Number.isFinite(uidNum) && uidNum > 0 && filteredRows.length) {
        const courseIds = filteredRows.map((r) => r.id);
        try {
            const [lessonTotals, completionTotals] = await Promise.all([
                Lesson.findAll({
                    attributes: [
                        'course_id',
                        [Course.sequelize.fn('COUNT', Course.sequelize.col('id')), 'total'],
                    ],
                    where: { course_id: courseIds },
                    group: ['course_id'],
                    raw: true,
                }),
                LessonCompletion.findAll({
                    attributes: [
                        'course_id',
                        [Course.sequelize.fn('COUNT', Course.sequelize.col('id')), 'done'],
                    ],
                    where: { course_id: courseIds, user_id: uidNum },
                    group: ['course_id'],
                    raw: true,
                }),
            ]);
            const totals = new Map(lessonTotals.map((r) => [Number(r.course_id), Number(r.total) || 0]));
            const dones = new Map(completionTotals.map((r) => [Number(r.course_id), Number(r.done) || 0]));
            for (const cid of courseIds) {
                const total = totals.get(cid) || 0;
                const done = Math.min(dones.get(cid) || 0, total);
                const pct = total ? Math.round((done / total) * 100) : 0;
                progressByCourse.set(cid, { total, done, pct });
            }
        } catch (e) {
            console.warn('[public/courses] progress hydration failed:', e.message);
        }
    }

    return {
        data: filteredRows.map((r) => {
            const card = sanitizeCourse(r);
            const p = progressByCourse.get(r.id);
            if (p) {
                card.lesson_count = p.total;
                card.completed_lesson_count = p.done;
                card.progress_pct = p.pct;
            }
            return card;
        }),
        // total is pre-narrowing — the frontend uses it only for "no results"
        // detection (length 0). Using the post-filter length keeps the count
        // honest with what the user actually sees and avoids ghost-pagination
        // (a page that shows "13 results" with only 2 cards because batch
        // narrowing dropped the rest).
        total: filteredRows.length,
        per_page: limit,
        current_page: page,
        last_page: Math.max(1, Math.ceil(filteredRows.length / limit)),
        categories: [],
    };
};

const detailsBySlug = async (slug, clgId = null) => {
    const course = await Course.findOne({ where: { slug } });
    if (!course) return null;

    // College gate: when the caller has a college set, the course's clg_ids
    // must contain it. Returning null is treated by the controller as
    // 404 — we deliberately don't 403 so we don't leak which slugs exist
    // for other colleges.
    if (clgId) {
        const ids = Array.isArray(course.clg_ids) ? course.clg_ids : [];
        if (!ids.includes(clgId)) return null;
    }

    const sections = await sectionRepo.findByCourse(course.id);
    const sectionIds = sections.map((s) => s.id);
    const lessons = await lessonRepo.findBySectionIds(sectionIds);
    const creator = await resolveInstructor(course);

    // Real student ratings drive the Reviews section + the rating/count badge.
    const { reviews, review_count, average_rating } = await reviewService.listForCourse(course.id);
    const sanitized = sanitizeCourse(course, sections, lessons, creator);
    sanitized.review_count = review_count;
    sanitized.average_rating = average_rating;
    sanitized.enrolled = await enrolledCount(course.id);

    return { course: sanitized, reviews };
};

// Number of distinct students enrolled in a course. Enrollment lives in
// user_progress (one row per user+program), so a student enrolled in the same
// course via two programs still counts once via distinct user_id. Best-effort:
// a query failure returns 0 rather than failing the whole course-details load.
const enrolledCount = async (courseId) => {
    try {
        return await UserProgress.count({
            where: { course_id: courseId, enrolled: true },
            distinct: true,
            col: 'user_id',
        });
    } catch (e) {
        console.warn('[public/course] enrolledCount failed:', e.message);
        return 0;
    }
};

const detailsFirstActive = async () => {
    const course = await Course.findOne({ where: { status: 'active' }, order: [['id', 'DESC']] });
    if (!course) return null;
    return detailsBySlug(course.slug);
};

// userIdRaw lets the caller (server.js) pass in the requesting student. When
// missing/invalid, progress fields render as zero (anonymous browse).
const playerData = async (slug, lessonIdRaw, userIdRaw) => {
    const course = await Course.findOne({ where: { slug } });
    if (!course) return null;

    const sections = await sectionRepo.findByCourse(course.id);
    const sectionIds = sections.map((s) => s.id);
    const lessons = await lessonRepo.findBySectionIds(sectionIds);
    const creator = await resolveInstructor(course);
    const sanitized = sanitizeCourse(course, sections, lessons, creator);

    const flatLessons = sanitized.sections.flatMap((s) => s.lessons);
    const VIDEO_TYPES = ['video-url', 'system-video', 'vimeo-url', 'html5', 'google_drive'];
    const firstVideoId = flatLessons.find((l) => VIDEO_TYPES.includes(l.lesson_type))?.id;
    const lessonId = Number(lessonIdRaw) || firstVideoId || flatLessons[0]?.id || null;
    const currentLessonRow = lessonId ? lessons.find((l) => l.id === lessonId) : null;

    const lesson = currentLessonRow
        ? {
            id: currentLessonRow.id,
            section_id: currentLessonRow.section_id,
            course_id: currentLessonRow.course_id,
            title: currentLessonRow.title,
            summary: currentLessonRow.summary || '',
            duration: currentLessonRow.duration || '00:00:00',
            lesson_type: currentLessonRow.lesson_type,
            is_free: currentLessonRow.is_free || 0,
            lesson_src: currentLessonRow.lesson_src || '',
            attachment: currentLessonRow.attachment || '',
            // Needed by the player to choose the right viewer (Office docs,
            // SCORM, etc.). PDFs happened to work without it because the
            // renderer falls back to the filename extension, but uploaded
            // Office files are stored under a token filename with no usable
            // extension, so they require the explicit attachment_type.
            attachment_type: currentLessonRow.attachment_type || '',
            description: currentLessonRow.description || '',
            sort: currentLessonRow.sort,
            // Quiz-only admin-set metadata — shown on the cover/intro screen
            // before the student clicks Start Quiz. Null on non-quiz lessons.
            total_mark: currentLessonRow.lesson_type === 'quiz'
                ? Number(currentLessonRow.total_mark || 0) : null,
            pass_mark: currentLessonRow.lesson_type === 'quiz'
                ? Number(currentLessonRow.pass_mark || 0) : null,
            retake: currentLessonRow.lesson_type === 'quiz'
                ? Number(currentLessonRow.retake || 0) : null,
        }
        : null;

    const userId = Number(userIdRaw) > 0 ? Number(userIdRaw) : 0;

    // For quiz lessons, load the admin-authored questions and expose them so
    // the player shows exactly what the admin added. QuizPlayer reads
    // lesson.questions (falling back to legacy lesson.attachment JSON). We
    // also surface this student's prior attempts so that re-entering the
    // lesson shows the last score and the correct "try again" state instead
    // of a fresh quiz.
    if (lesson && currentLessonRow.lesson_type === 'quiz') {
        const rows = await questionRepo.findByQuiz(currentLessonRow.id);
        lesson.questions = rows.map(normalizeQuizQuestion);

        // Read per-quiz state from the JSON mirror on the student row
        // (users.quizScores[quiz_id]) — auth-DB scoped, so the auth userId
        // string round-trips correctly even though quiz_submissions.user_id
        // clamps large ids to INT max.
        let quizState = { attempts_used: 0, last_score: null, last_total: null };
        if (userId) {
            try {
                const rows = await authDb.query(
                    `SELECT JSON_EXTRACT(quizScores, CONCAT('$."', :qid, '"')) AS slot
                       FROM users WHERE userId = :uid`,
                    {
                        replacements: { qid: String(currentLessonRow.id), uid: String(userId) },
                        type: QueryTypes.SELECT,
                    }
                );
                const raw = rows[0]?.slot;
                const slot = typeof raw === 'string' ? JSON.parse(raw) : raw;
                if (slot && typeof slot === 'object') {
                    quizState = {
                        attempts_used: Number(slot.attempts) || 0,
                        last_score: slot.score == null ? null : Number(slot.score),
                        last_total: slot.total == null ? null : Number(slot.total),
                    };
                }
            } catch (e) {
                console.warn('[playerData] quizScores read failed:', e.message);
            }
        }
        lesson.quiz_state = quizState;
    }
    const stored = userId ? watchStore.getHistory(course.id, userId) : null;
    const completedIds = stored ? stored.completed_lesson : [];
    const totalLessons = sanitized.lesson_count;
    const progress = totalLessons ? Math.round((completedIds.length / totalLessons) * 100) : 0;

    const lockedLessonIds = [];
    if (course.enable_drip_content) {
        let blocked = false;
        for (const sec of sanitized.sections) {
            for (const l of sec.lessons) {
                if (blocked) lockedLessonIds.push(l.id);
                else if (!completedIds.includes(l.id)) blocked = true;
            }
        }
    }

    return {
        course: sanitized,
        lesson,
        history: {
            course_id: course.id,
            student_id: userId,
            watching_lesson_id: stored?.watching_lesson_id || lesson?.id || null,
            completed_lesson: completedIds,
        },
        locked_lesson_ids: lockedLessonIds,
        progress,
        completed_lesson_count: completedIds.length,
    };
};

// Record one quiz attempt for a student. The frontend computes the score
// (it already does for instant feedback); we persist score/total so a later
// page load can restore the result and remaining-retry state. Returns the
// authoritative attempt count after saving.
const submitQuiz = async ({ quiz_id, user_id, score, total, answers }) => {
    // Keep BOTH forms of the user id around:
    //   uidStr — the auth users.userId PK (string; can exceed INT range)
    //   uidNum — what we write into quiz_submissions.user_id (declared BIGINT
    //            in the model but the underlying MySQL column is INT, so
    //            values > 2^31-1 get clamped). We use uidStr for everything
    //            that must round-trip the real identity (the JSON mirror and
    //            attempt counting via auth-side keys).
    const uidStr = String(user_id || '').trim();
    const uidNum = Number(user_id) > 0 ? Number(user_id) : 0;
    const qid = Number(quiz_id);
    if (!uidStr || !qid) {
        // No identity → can't persist per-user; report a transient count of 1
        // so the client still shows the result for this session.
        return { attempts_used: 1, persisted: false };
    }
    await quizSubmissionRepo.create({
        quiz_id: qid,
        user_id: uidNum,
        score: Number(score),
        total: Number(total),
        correct_answer: JSON.stringify(score),
        wrong_answer: JSON.stringify(Math.max(0, Number(total) - Number(score))),
        submits: JSON.stringify({ score: Number(score), total: Number(total), answers: answers || null }),
    });

    // Mirror onto the student schema: users.quizScores is a JSON object
    // keyed by quiz_id. Each quiz's slot holds the latest score/total plus
    // attempt count. Keys are independent — submitting quiz A never touches
    // quiz B's slot. JSON_SET on a NULL column is fine: COALESCE seeds it
    // to '{}' on first write. We compute the per-user attempt count by
    // reading the current JSON slot (auth-DB scoped to uidStr), avoiding
    // the INT-clamping bug in quiz_submissions.user_id.
    let attempts_used = 1;
    try {
        const cur = await authDb.query(
            `SELECT JSON_EXTRACT(quizScores, CONCAT('$."', :qid, '".attempts')) AS prev
               FROM users WHERE userId = :uid`,
            { replacements: { qid: String(qid), uid: uidStr }, type: QueryTypes.SELECT }
        );
        const prev = cur[0]?.prev;
        attempts_used = (Number.isFinite(Number(prev)) ? Number(prev) : 0) + 1;

        await authDb.query(
            `UPDATE users
                SET quizScores = JSON_SET(
                    COALESCE(quizScores, JSON_OBJECT()),
                    CONCAT('$."', :qid, '"'),
                    JSON_OBJECT(
                        'score', :score,
                        'total', :total,
                        'attempts', :attempts,
                        'lastAttemptAt', CAST(NOW() AS CHAR)
                    )
                )
              WHERE userId = :uid`,
            {
                replacements: {
                    qid: String(qid),
                    score: Number(score),
                    total: Number(total),
                    attempts: attempts_used,
                    uid: uidStr,
                },
                type: QueryTypes.UPDATE,
            }
        );
    } catch (e) {
        // Best-effort: the submission row is the source of truth, the JSON
        // mirror is denormalized convenience. Don't fail the request.
        console.warn('[submitQuiz] failed to mirror users.quizScores:', e.message);
        // Fall back to the clamped-int count if mirror failed entirely.
        try { attempts_used = await quizSubmissionRepo.countByQuizAndUser(qid, uidNum); }
        catch { /* keep attempts_used = 1 */ }
    }

    return { attempts_used, persisted: true };
};

module.exports = { list, detailsBySlug, detailsFirstActive, playerData, submitQuiz };
