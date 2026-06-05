const path = require('path');
const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const { sequelize } = require('./models');
const { adminOnly, rootOnly, auth, adminOrInstructor } = require('./middlewares/auth');
const { errorHandler } = require('./middlewares/error');

const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const categoryRoutes = require('./routes/category.routes');
const courseRoutes = require('./routes/course.routes');
const curriculumRoutes = require('./routes/curriculum.routes');
const quizRoutes = require('./routes/quiz.routes');
const liveClassRoutes = require('./routes/liveclass.routes');
const zoomLiveClassRoutes = require('./zoom-live-class/live-class.routes');
const forumRoutes = require('./forum/forum.routes');
const couponRoutes = require('./routes/coupon.routes');
const programRoutes = require('./routes/program.routes');
const certificateRoutes = require('./routes/certificate.routes');
const collegeDashboardRoutes = require('./routes/collegeDashboard.routes');
const batchRoutes = require('./routes/batch.routes');
const collegeRoutes = require('./routes/college.routes');
const studentRoutes = require('./routes/student.routes');
const instructorRoutes = require('./routes/instructor.routes');
const preAssessmentRoutes = require('./routes/preassessment.routes');
const languageRoutes = require('./routes/language.routes');

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(path.join(__dirname, '..', env.uploadDir)));

app.get(['/api/health', '/health'], (_req, res) => res.json({ ok: true, service: 'admin-service' }));

// Service-to-service email enqueue. Used today by assessment-service to
// queue a "you've registered for pre-assessment" mail without having to own
// a second DB connection into lms_admin.email_jobs. Guarded by a shared
// secret in the X-Internal-Secret header — leave INTERNAL_API_SECRET unset
// to disable the endpoint entirely.
//
// Body shape:
//   {
//     template: 'preAssessmentRegistered',  // template name in emailTemplates.js
//     data: { studentName, programName, ... },  // template-specific
//     to: '<recipient email>',
//     userId: '<optional auth userId, stored for audit>',
//     batchId: <optional batch id, stored for audit>
//   }
const emailTemplates = require('./helpers/emailTemplates');
const { enqueue: enqueueEmail } = require('./jobs/emailQueue');
app.post('/api/internal/email/enqueue', express.json({ limit: '1mb' }), async (req, res) => {
    const expected = env.internalSecret;
    if (!expected) return res.status(503).json({ error: 'Internal endpoints disabled' });
    const provided = req.headers['x-internal-secret'];
    if (!provided || provided !== expected) {
        return res.status(401).json({ error: 'Unauthorised' });
    }
    try {
        const { template, data, to, userId, batchId } = req.body || {};
        const builder = template && emailTemplates[template];
        if (typeof builder !== 'function') {
            return res.status(422).json({ error: `Unknown template: ${template}` });
        }
        if (!to || typeof to !== 'string') {
            return res.status(422).json({ error: 'Recipient `to` is required' });
        }
        // Inject defaults the caller doesn't need to know about. Today this
        // is just loginUrl — pulling it from env.mail keeps the link
        // consistent across templates and across services.
        const enriched = {
            loginUrl: env.mail.lmsLoginUrl,
            ...(data || {}),
        };
        // For the pre-assessment confirmation, resolve the actual course name
        // from the selected program (programs/courses live here in lms_admin,
        // not in assessment-service). A program can bundle multiple courses —
        // join their titles. Best-effort: on any miss, the template falls back
        // to programName.
        if (template === 'preAssessmentRegistered' && enriched.programId) {
            try {
                const { Program, Course } = require('./models');
                const program = await Program.findByPk(Number(enriched.programId), {
                    attributes: ['id', 'course_id', 'course_ids'],
                    raw: true,
                });
                if (program) {
                    let courseIds = Array.isArray(program.course_ids) ? program.course_ids : [];
                    if (!courseIds.length && program.course_id) courseIds = [program.course_id];
                    courseIds = courseIds.map(Number).filter(Boolean);
                    if (courseIds.length) {
                        const courses = await Course.findAll({
                            where: { id: courseIds },
                            attributes: ['title'],
                            raw: true,
                        });
                        const names = courses.map((c) => c.title).filter(Boolean);
                        if (names.length) enriched.courseName = names.join(', ');
                    }
                }
            } catch (e) {
                console.warn('[internal/email/enqueue] course-name lookup failed:', e.message);
            }
        }
        const { subject, html } = builder(enriched);
        await enqueueEmail({ to, subject, html, userId, batchId });
        return res.status(202).json({ queued: true });
    } catch (e) {
        console.warn('[internal/email/enqueue] failed:', e.message);
        return res.status(500).json({ error: 'Enqueue failed' });
    }
});

// Public read-only endpoints — no auth required
const categoryService = require('./services/CategoryService');
app.get('/api/public/categories', async (req, res, next) => {
    try {
        // Student-facing calls pass ?clgId=<their-college>. The presence of
        // the param (even empty) switches the service into college-gated
        // mode. Admin/internal callers that omit it still get the full tree.
        const clgId = 'clgId' in req.query ? String(req.query.clgId ?? '') : undefined;
        res.json(await categoryService.list(clgId));
    } catch (e) { next(e); }
});

// Public colleges list — used by the student profile dropdown.
// Admin creates colleges in this same DB so this is the single source of truth.
const collegeService = require('./services/CollegeService');
app.get('/api/public/colleges', async (_req, res, next) => {
    try {
        const { colleges } = await collegeService.list({ per_page: 1000 });
        res.json(colleges);
    } catch (e) { next(e); }
});

// Public contact form ("Get in Touch" / "Partner with Us"). Stores the
// submission and queues an admin notification email. Unauthenticated by design.
const contactService = require('./services/ContactService');
app.post('/api/public/contact', express.json(), async (req, res) => {
    try {
        const { firstName, lastName, email, subject, message } = req.body || {};
        const result = await contactService.submit({ firstName, lastName, email, subject, message });
        return res.status(201).json({ ok: true, id: result.id });
    } catch (e) {
        if (e && e.status) return res.status(e.status).json({ error: e.message });
        console.warn('[public/contact] failed:', e.message);
        return res.status(500).json({ error: 'Failed to send your message' });
    }
});

// Public programs list — used by the student-facing Programs page so the
// admin-curated set drives what students see. Only active programs surface.
//
// Optional filters:
//   ?clgId=<clgId>     → only programs whose clg_ids contains the college
//   ?course_id=<id>    → only programs whose course_ids contains the course
// Both filters AND together. The arrow on My Courses uses these to show
// "programs that include THIS course for MY college".
const programService = require('./services/ProgramService');
// Programs the *student* is eligible for, used by the Pre-Assessment
// onboarding modal. Filtered by the student's collegeId + (batch_members
// overlap with program.batch_ids OR user_progress course overlap with
// program.course_ids). Public because student JWT isn't reachable here —
// caller passes user_id (header or query) the same way other /api/public
// student endpoints do.
app.get('/api/public/programs/eligible', async (req, res) => {
    try {
        const userId = req.headers['x-user-id'] || req.query.user_id;
        const { programs } = await programService.listEligible(userId);
        return res.json({ programs });
    } catch (e) {
        console.warn('[public/programs/eligible] failed:', e.message);
        return res.json({ programs: [] });
    }
});

app.get('/api/public/programs', async (req, res, next) => {
    try {
        const { programs } = await programService.list();
        const clgId = typeof req.query.clgId === 'string' ? req.query.clgId.trim() : '';
        const courseIdRaw = req.query.course_id ?? req.query.courseId;
        const courseIdNum = courseIdRaw == null || courseIdRaw === ''
            ? null
            : Number(String(courseIdRaw).trim());
        const courseId = Number.isInteger(courseIdNum) && courseIdNum > 0 ? courseIdNum : null;

        // Strict student-scope gate: when user_id is supplied we treat the
        // (college, course, batch) tuple as the canonical filter. Admin has
        // already linked every program to specific batches, so we don't
        // surface unscoped programs or fall back when the student has no
        // memberships — both would leak programs the admin didn't intend
        // for this student. Anonymous callers (no user_id) still get the
        // college+course filter only, used by the marketing/public listing.
        const userId = req.headers['x-user-id'] || req.query.user_id;
        let studentBatchIds = null;
        let studentScoped = false;
        if (userId) {
            studentScoped = true;
            const { BatchMember } = require('./models');
            const memberRows = await BatchMember.findAll({
                where: { user_id: String(userId) },
                attributes: ['batch_id'],
                raw: true,
            }).catch(() => []);
            const ids = memberRows.map((r) => Number(r.batch_id)).filter((n) => Number.isFinite(n));
            studentBatchIds = new Set(ids);
        }

        const filtered = (programs || [])
            .filter((p) => p.is_active !== false)
            .filter((p) => {
                if (!clgId) return true;
                const ids = Array.isArray(p.clg_ids) ? p.clg_ids.map(String) : [];
                return ids.includes(String(clgId));
            })
            .filter((p) => {
                if (!courseId) return true;
                // course_ids holds the new multi-value list; course_id is the
                // legacy single-value column. Treat either as a match so old
                // rows keep surfacing while the column-swap settles.
                const ids = Array.isArray(p.course_ids) ? p.course_ids.map(Number) : [];
                if (ids.includes(courseId)) return true;
                return Number(p.course_id || 0) === courseId;
            })
            .filter((p) => {
                if (!studentScoped) return true;
                // Student-scoped: program MUST be batch-scoped AND overlap
                // one of the student's batches. No memberships → no programs.
                if (studentBatchIds.size === 0) return false;
                const pb = Array.isArray(p.batch_ids) ? p.batch_ids.map(Number) : [];
                if (pb.length === 0) return false;
                return pb.some((id) => studentBatchIds.has(id));
            });
        res.json({ programs: filtered });
    } catch (e) { next(e); }
});

// Course content endpoints — real DB first, mock fallback
const courseContentCtrl = require('./course-content/CourseController');
const playerCtrl = require('./course-content/PlayerController');
const publicCourseService = require('./course-content/PublicCourseService');

app.get('/api/public/courses', async (req, res, next) => {
    // When the caller supplies a clgId (or explicitly *no* clgId) the response
    // must reflect that scope honestly: returning the mock catalog as a
    // fallback would leak unrelated courses across colleges. Only fall back
    // to mock when no college filtering is in play (legacy callers that
    // never sent clgId).
    const collegeAware = 'clgId' in req.query;
    try {
        const real = await publicCourseService.list(req.query);
        if (collegeAware || real?.data?.length) return res.json(real);
        return courseContentCtrl.list(req, res, next);
    } catch (e) {
        console.warn('[public/courses] DB failed:', e.message);
        if (collegeAware) {
            return res.status(503).json({ error: 'Course catalog unavailable' });
        }
        return courseContentCtrl.list(req, res, next);
    }
});

app.get('/api/public/course/:slug', async (req, res) => {
    const clgId = typeof req.query.clgId === 'string' ? req.query.clgId.trim() : null;
    try {
        const real = req.params.slug === 'first'
            ? await publicCourseService.detailsFirstActive()
            : await publicCourseService.detailsBySlug(req.params.slug, clgId || null);
        if (real) return res.json(real);
        // Course-detail must always reflect real admin data. Previously this
        // fell back to mockData (Mastering React 18, etc.) whenever the slug
        // had no matching courses row, so the page showed hardcoded content.
        // Return a clean 404 instead — never serve mock for course detail.
        return res.status(404).json({ error: 'Course not found' });
    } catch (e) {
        console.warn('[public/course] DB failed:', e.message);
        // No mock fallback here either — surface the failure honestly rather
        // than masking it with hardcoded course data.
        return res.status(503).json({ error: 'Course unavailable' });
    }
});

// ---- Course reviews (student-side) ----
// Public + student-keyed via x-user-id, mirroring the certificate/player flow.
const reviewService = require('./course-content/ReviewService');

// The current student's own review for a course (by numeric course id), plus
// whether they're eligible to submit one (course completed + not yet rated).
// Drives the Rate tab's state in the player.
app.get('/api/public/course/:courseId/my-review', async (req, res) => {
    try {
        const courseId = Number(req.params.courseId);
        const userId = req.headers['x-user-id'] || req.query.user_id || '';
        if (!courseId) return res.status(400).json({ error: 'Invalid course id' });
        const review = await reviewService.getMyReview(courseId, userId);
        const completed = userId ? await reviewService.hasCompletedCourse(courseId, userId) : false;
        return res.json({ review, can_rate: completed && !review, completed });
    } catch (e) {
        console.warn('[public/my-review] failed:', e.message);
        return res.status(500).json({ error: 'Failed to load your review' });
    }
});

// Submit a one-time rating (1–5 stars + optional text). Enforces completion and
// the single-rating-per-student rule in the service.
app.post('/api/public/course/:courseId/review', express.json(), async (req, res) => {
    try {
        const courseId = Number(req.params.courseId);
        const userId = req.headers['x-user-id'] || req.body.user_id || '';
        if (!courseId) return res.status(400).json({ error: 'Invalid course id' });
        const created = await reviewService.submit({
            courseId,
            userId,
            userName: req.body.user_name,
            rating: req.body.rating,
            review: req.body.review,
        });
        return res.status(201).json({ review: created });
    } catch (e) {
        if (e && e.status) return res.status(e.status).json({ error: e.message });
        console.warn('[public/review] failed:', e.message);
        return res.status(500).json({ error: 'Failed to submit your review' });
    }
});

app.get('/api/public/player/:slug', async (req, res, next) => {
    try {
        const userId = req.headers['x-user-id'] || req.query.user_id;
        const real = await publicCourseService.playerData(req.params.slug, req.query.lesson_id, userId);
        if (real) return res.json(real);
        return playerCtrl.player(req, res, next);
    } catch (e) {
        console.warn('[public/player] DB failed, falling back to mock:', e.message);
        return playerCtrl.player(req, res, next);
    }
});
app.post('/api/public/player/complete', playerCtrl.complete);
app.post('/api/public/player/progress', playerCtrl.progress);

// Persist one quiz attempt so re-entering the lesson restores the last score
// and remaining-retry state. user_id comes from the x-user-id header (set by
// the frontend course API interceptor) or the body, matching existing pattern.
app.post('/api/public/player/quiz-submit', async (req, res) => {
    try {
        const user_id = req.headers['x-user-id'] || req.body.user_id;
        const result = await publicCourseService.submitQuiz({ ...req.body, user_id });
        return res.json(result);
    } catch (e) {
        console.warn('[public/player/quiz-submit] failed:', e.message);
        return res.status(500).json({ error: 'Could not save quiz attempt' });
    }
});

// Student-facing program request: the logged-in student sees a request an
// admin sent them ("you are eligible for X") and accepts/rejects it. Student
// identity via x-user-id header, matching the other /api/public endpoints.
const studentSvc = require('./services/StudentService');
app.get('/api/public/program-request', async (req, res) => {
    try {
        const userId = req.headers['x-user-id'] || req.query.user_id;
        return res.json(await studentSvc.getStudentProgramRequest(userId));
    } catch (e) {
        console.warn('[public/program-request] failed:', e.message);
        return res.status(500).json({ error: 'Could not load program request' });
    }
});
app.get('/api/public/program-request/accepted', async (req, res) => {
    try {
        const userId = req.headers['x-user-id'] || req.query.user_id;
        return res.json(await studentSvc.getAcceptedProgram(userId));
    } catch (e) {
        console.warn('[public/program-request/accepted] failed:', e.message);
        return res.status(500).json({ error: 'Could not load accepted program' });
    }
});
app.post('/api/public/program-request/respond', async (req, res) => {
    try {
        const userId = req.headers['x-user-id'] || req.body.user_id;
        const result = await studentSvc.respondProgramRequest(userId, req.body.action);
        return res.json(result);
    } catch (e) {
        const code = e.status || 500;
        if (code === 500) console.warn('[public/program-request/respond] failed:', e.message);
        return res.status(code).json({ error: e.message || 'Could not respond' });
    }
});

// User progress / enrollment — public because student JWT lives in a cookie on a
// different service; user_id is passed in body/query as the existing pattern.
const userProgressRoutes = require('./routes/userprogress.routes');
app.use('/api', userProgressRoutes);

// Returns the user's highest course progress (0-100) and a course-completed flag.
// Used by the Assessments tab to gate the Post-Assessment button. The user_id query
// param matches the watch store's keying (defaults to 99 for the dev/anonymous case).
const watchStore = require('./course-content/watchStore');
const { Lesson } = require('./models');
app.get('/api/public/course-progress', async (req, res) => {
    try {
        // Pull the student id from header first (set by frontend axios interceptor),
        // fall back to query param. No silent default — anonymous = empty progress.
        const userId = Number(req.headers['x-user-id'] || req.query.user_id) || 0;
        if (!userId) return res.json({ user_id: 0, max_progress: 0, completed_any: false });
        const histories = watchStore.listHistoriesForUser(userId);
        if (!histories.length) return res.json({ user_id: userId, max_progress: 0, completed_any: false });

        const courseIds = histories.map((h) => h.course_id);
        // Tally lesson counts per course in a single grouped query.
        const lessonCounts = await Lesson.findAll({
            where: { course_id: courseIds },
            attributes: ['course_id', [Lesson.sequelize.fn('COUNT', Lesson.sequelize.col('id')), 'count']],
            group: ['course_id'],
            raw: true,
        });
        const totalByCourse = Object.fromEntries(lessonCounts.map((r) => [Number(r.course_id), Number(r.count) || 0]));

        let maxProgress = 0;
        let completedAny = false;
        for (const h of histories) {
            const total = totalByCourse[h.course_id] || 0;
            if (!total) continue;
            const done = (h.completed_lesson || []).length;
            const pct = Math.round((done / total) * 100);
            if (pct > maxProgress) maxProgress = pct;
            if (done >= total) completedAny = true;
        }
        return res.json({ user_id: userId, max_progress: maxProgress, completed_any: completedAny });
    } catch (err) {
        console.warn('[course-progress] failed:', err.message);
        return res.json({ user_id: Number(req.query.user_id) || 99, max_progress: 0, completed_any: false });
    }
});

// Public auth endpoints (login is unauthenticated; me/logout require token)
app.use('/api/admin', authRoutes);

// Course / curriculum / zoom-live-class routers apply per-route role gates
// internally (adminOnly vs adminOrInstructor) so instructors can manage the
// Curriculum + Live Class tabs of their own courses. JWT decoding still
// happens at the mount point via `auth` so req.user is populated.
//
// IMPORTANT: these MUST be registered before the adminOnly-gated routers
// below. Express runs a mount's middleware (e.g. `adminOnly`) for every
// request matching the path prefix — even when that router has no matching
// route. `adminOnly` short-circuits with a 403 for non-admins and never
// calls next(), so if an adminOnly mount sits earlier in the chain it kills
// an instructor's request before it can fall through to courseRoutes.
app.use('/api/admin', auth, categoryRoutes);
app.use('/api/admin', auth, courseRoutes);
app.use('/api/admin', auth, curriculumRoutes);
app.use('/api/admin', auth, zoomLiveClassRoutes.admin);
app.use('/api/public', zoomLiveClassRoutes.public);
app.use('/api/admin', auth, forumRoutes.admin);
app.use('/api/public', forumRoutes.public);

// Root-only endpoints — global management a single college's admin must NOT
// reach (manage other admins, manage colleges). rootOnly is applied PER-ROUTE
// inside these routers (not at the mount), because mounting rootOnly on the
// shared '/api/admin' prefix would 403 the entire namespace for college admins
// before Express could fall through to the adminOnly routers below (e.g.
// college-dashboard). Here we only decode the JWT; the routers self-gate.
app.use('/api/admin', auth, adminRoutes);
app.use('/api/admin', auth, collegeRoutes);

// Protected admin endpoints — adminOnly enforces JWT + role (admin OR root).
// College-scoped surfaces a college admin legitimately uses; the service layer
// scopes results by req.user.college_id where applicable.
app.use('/api/admin', adminOnly, quizRoutes);
app.use('/api/admin', adminOnly, liveClassRoutes);
app.use('/api/admin', adminOnly, couponRoutes);
app.use('/api/admin', adminOnly, programRoutes);
app.use('/api/admin', adminOnly, certificateRoutes);
app.use('/api/admin', adminOnly, collegeDashboardRoutes);
app.use('/api/admin', adminOnly, batchRoutes);
app.use('/api/admin', adminOnly, studentRoutes);
app.use('/api/admin', adminOnly, instructorRoutes);
app.use('/api/admin', adminOnly, languageRoutes);

// Public certificate routes — unauthenticated. Mirror the player flow which
// also uses /api/public/* with an x-user-id header for student keying.
const certificateCtrl = require('./controllers/CertificateController');
app.get('/api/public/certificate/find', certificateCtrl.studentFind);
app.get('/api/public/certificate/mine', certificateCtrl.studentList);
app.post('/api/public/certificate/issue', certificateCtrl.studentIssue);
app.get('/api/public/certificate/:identifier', certificateCtrl.render);

// Aggregated student-overview KPIs:
//   - active_programs:    enrolled UserProgress rows where the course isn't 100% done
//   - completed_programs: enrolled UserProgress rows where the course IS 100% done
//   - certificates:       count of Certificate rows for this user
// One round-trip to keep the dashboard snappy. Reuses the same watchStore +
// Lesson tally as /api/public/course-progress above.
const { UserProgress, Certificate } = require('./models');
app.get('/api/public/student/overview-stats', async (req, res) => {
    try {
        const rawUserId = req.headers['x-user-id'] || req.query.user_id;
        if (!rawUserId) {
            return res.json({ active_programs: 0, completed_programs: 0, certificates: 0 });
        }

        // user_id needs both shapes: BIGINT for UserProgress, string for Certificate.
        const userIdNum = Number(rawUserId);
        const userIdStr = String(rawUserId);

        // Pull all enrollments for this user.
        const enrollments = Number.isFinite(userIdNum) && userIdNum > 0
            ? await UserProgress.findAll({
                where: { user_id: userIdNum, enrolled: true },
                attributes: ['program_id', 'course_id'],
                raw: true,
            })
            : [];

        // For each enrolled course, calc completion using watchStore + Lesson totals.
        const courseIds = enrollments.map((e) => e.course_id).filter(Boolean);
        const completedCourses = new Set();
        if (courseIds.length) {
            const lessonCounts = await Lesson.findAll({
                where: { course_id: courseIds },
                attributes: ['course_id', [Lesson.sequelize.fn('COUNT', Lesson.sequelize.col('id')), 'count']],
                group: ['course_id'],
                raw: true,
            });
            const totalByCourse = Object.fromEntries(
                lessonCounts.map((r) => [Number(r.course_id), Number(r.count) || 0])
            );
            const histories = watchStore.listHistoriesForUser(userIdNum);
            const doneByCourse = Object.fromEntries(
                histories.map((h) => [Number(h.course_id), (h.completed_lesson || []).length])
            );
            for (const courseId of courseIds) {
                const total = totalByCourse[Number(courseId)] || 0;
                const done = doneByCourse[Number(courseId)] || 0;
                if (total > 0 && done >= total) completedCourses.add(Number(courseId));
            }
        }

        const activePrograms = enrollments.filter((e) => !completedCourses.has(Number(e.course_id))).length;
        const completedPrograms = enrollments.filter((e) => completedCourses.has(Number(e.course_id))).length;

        // Certificate count is keyed by string user_id (auth-service shape).
        const certificates = await Certificate.count({ where: { user_id: userIdStr } });

        return res.json({
            user_id: userIdStr,
            active_programs: activePrograms,
            completed_programs: completedPrograms,
            certificates,
        });
    } catch (err) {
        console.warn('[overview-stats] failed:', err.message);
        return res.json({ active_programs: 0, completed_programs: 0, certificates: 0 });
    }
});

// Student-accessible: any authenticated user (admin or student) can submit / read their own pre-assessment.
app.use('/api', auth, preAssessmentRoutes);

app.use(errorHandler);

process.on('unhandledRejection', (reason) => {
    console.error('Unhandled promise rejection:', reason);
});
process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:', err);
});

let httpServer = null;

const start = () => {
    httpServer = app.listen(env.port, () => {
        console.log(`admin-service running on ${env.port}`);
    });

    // Start the email queue worker now that the HTTP server is up. Jobs
    // already in the table (e.g. from a previous run that crashed mid-send)
    // will be picked up on the next tick. No-op silently when SMTP isn't
    // configured (mailer.isConfigured() guards the poll).
    try {
        const emailWorker = require('./jobs/emailWorker');
        emailWorker.start();
    } catch (e) {
        console.warn('[email-worker] failed to start:', e.message);
    }

    // app.listen() returns asynchronously — bind failures (EADDRINUSE,
    // EACCES) arrive as 'error' events on the server, NOT as thrown
    // exceptions. Without this handler they bubble to uncaughtException
    // and nodemon respawns straight into the same wall. Fail fast with a
    // clear, actionable message so the operator fixes it once.
    httpServer.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.error(`\n[admin-service] Port ${env.port} is already in use.`);
            console.error('Another admin-service (or unrelated process) is bound. Free it with:');
            console.error(`  PowerShell:  Get-NetTCPConnection -LocalPort ${env.port} -State Listen | %{ Stop-Process -Id $_.OwningProcess -Force }`);
            console.error('Or set PORT=<other> in admin-service/.env and restart.\n');
            process.exit(1);
        }
        if (err.code === 'EACCES') {
            console.error(`[admin-service] Permission denied binding port ${env.port} (try a port >1024).`);
            process.exit(1);
        }
        console.error('[admin-service] HTTP server error:', err);
        process.exit(1);
    });
};

// Graceful shutdown — release the port on Ctrl+C / nodemon restart so the
// next bind doesn't race against a TIME_WAIT socket.
const shutdown = (signal) => {
    if (!httpServer) process.exit(0);
    console.log(`\n[admin-service] ${signal} received, closing server...`);
    httpServer.close(() => process.exit(0));
    // Hard cap: if connections won't drain, exit anyway after 5s.
    setTimeout(() => process.exit(0), 5000).unref();
};
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

sequelize.authenticate()
    .then(async () => {
        // Hydrate the in-memory watch store from MySQL so completion ticks and
        // resume positions survive a restart. Failure here is non-fatal — cold
        // cache just means new writes still persist normally.
        try {
            const watchStore = require('./course-content/watchStore');
            const stats = await watchStore.loadFromDb();
            console.log(`watchStore hydrated: ${stats.histories} histories, ${stats.durations} durations`);
        } catch (e) {
            console.warn('watchStore hydrate failed:', e.message);
        }

        // Idempotently add instructor-specific columns to the auth-service
        // users table when missing. The auth-service owns this schema, but
        // adding the column from its own boot would require a redeploy of a
        // second service — wedging it here keeps the instructor admin flow
        // working in dev with just an admin-service restart. Safe to run on
        // every startup (DESCRIBE first, ALTER only when absent).
        try {
            const authDb = require('./config/authDatabase');
            const cols = await authDb.query('DESCRIBE users', { type: require('sequelize').QueryTypes.SELECT });
            const hasInstructorPhoto = cols.some((c) => c.Field === 'instructorPhoto');
            if (!hasInstructorPhoto) {
                await authDb.query("ALTER TABLE users ADD COLUMN instructorPhoto VARCHAR(255) NULL");
                console.log("🛠️  Added users.instructorPhoto column (auth DB)");
            }
            // studentPhoto: separate column so future student & instructor
            // profile flows can't accidentally overwrite each other on a
            // shared photo column. Same idempotent ALTER as above.
            const hasStudentPhoto = cols.some((c) => c.Field === 'studentPhoto');
            if (!hasStudentPhoto) {
                await authDb.query("ALTER TABLE users ADD COLUMN studentPhoto VARCHAR(255) NULL");
                console.log("🛠️  Added users.studentPhoto column (auth DB)");
            }
            // Seconds the student spent on the post-assessment, mirroring
            // preScoreDuration. Surfaces on Manage Students next to the post
            // score. Idempotent — added once when missing.
            const hasPostScoreDuration = cols.some((c) => c.Field === 'postScoreDuration');
            if (!hasPostScoreDuration) {
                await authDb.query("ALTER TABLE users ADD COLUMN postScoreDuration INT NULL");
                console.log("🛠️  Added users.postScoreDuration column (auth DB)");
            }
        } catch (e) {
            console.warn('[auth-db] photo column check failed:', e.message);
        }

        try {
            const { Language } = require('./models');
            await Language.sync();
        } catch (e) {
            console.warn('[languages] table sync failed:', e.message);
        }

        // course_reviews: one student rating per (user_id, course_id). Created
        // on startup so the student Rate tab can write and the course-details
        // page can aggregate. sync() (no alter) just creates it when missing
        // and is a no-op once it exists.
        try {
            const { CourseReview } = require('./models');
            await CourseReview.sync();
        } catch (e) {
            console.warn('[course_reviews] table sync failed:', e.message);
        }

        // contact_messages: public contact-form submissions. Created on startup
        // so the public POST /api/public/contact can persist; no-op once it
        // exists.
        try {
            const { ContactMessage } = require('./models');
            await ContactMessage.sync();
        } catch (e) {
            console.warn('[contact_messages] table sync failed:', e.message);
        }

        // courses.has_certificate: per-course toggle for "this course grants
        // a certificate on completion". Older schemas don't have the column;
        // add it on startup so the admin form can write to it and the
        // public course-details payload can read it. Default TRUE preserves
        // existing UX (the previous hardcoded "Certificate Course" label).
        try {
            const { QueryTypes } = require('sequelize');
            const [col] = await sequelize.query(
                "SHOW COLUMNS FROM courses WHERE Field = 'has_certificate'",
                { type: QueryTypes.SELECT }
            );
            if (!col) {
                await sequelize.query(
                    'ALTER TABLE courses ADD COLUMN has_certificate TINYINT(1) NOT NULL DEFAULT 1'
                );
                console.log('🛠️  Added courses.has_certificate column');
            }
        } catch (e) {
            console.warn('[courses] has_certificate column check failed:', e.message);
        }

        // courses.batch_ids: JSON array of batch ids the course is scoped to.
        // Sibling of clg_ids — added so Add/Edit Course can save batch scope
        // alongside the existing college scope.
        try {
            const { QueryTypes } = require('sequelize');
            const [col] = await sequelize.query(
                "SHOW COLUMNS FROM courses WHERE Field = 'batch_ids'",
                { type: QueryTypes.SELECT }
            );
            if (!col) {
                await sequelize.query('ALTER TABLE courses ADD COLUMN batch_ids JSON NULL');
                console.log('🛠️  Added courses.batch_ids column');
            }
        } catch (e) {
            console.warn('[courses] batch_ids column check failed:', e.message);
        }

        // Course discussion forum — create the `forums` + `forum_reports`
        // tables on first run so the module is usable without a manual
        // migration. Mirrors the Languages pattern above. No-op on restart.
        try {
            const { Forum, ForumReport } = require('./models');
            await Forum.sync();
            await ForumReport.sync();
        } catch (e) {
            console.warn('[forum] table sync failed:', e.message);
        }

        // Programs — top-level offerings shown on the public Programs page
        // (AI Frontier, AI Frontier Plus, Elite AI Residency, …). Same
        // idempotent .sync() pattern as Forum so the table is created on
        // first run without a manual migration.
        try {
            const { Program } = require('./models');
            await Program.sync();
        } catch (e) {
            console.warn('[programs] table sync failed:', e.message);
        }

        // Batches — named cohorts of students inside a college. Created from
        // the College Dashboard's Add/Manage Batches tabs. Member rows live
        // in the linked batch_members table; both are created on first run.
        try {
            const { Batch, BatchMember } = require('./models');
            await Batch.sync();
            await BatchMember.sync();
        } catch (e) {
            console.warn('[batches] table sync failed:', e.message);
        }

        // Durable email queue for batch-add notifications. The worker (set
        // up below in `start`) polls this table — no Redis dependency.
        try {
            const { EmailJob } = require('./models');
            await EmailJob.sync();
        } catch (e) {
            console.warn('[email-jobs] table sync failed:', e.message);
        }

        // Late-added Program columns: clg_ids (multi-select colleges) and
        // course_id (single course FK). .sync() above creates the table but
        // doesn't add new columns to an existing one, so we DESCRIBE first
        // and ALTER only when absent — same pattern courses.has_certificate
        // uses above. Safe to run on every restart.
        try {
            const { QueryTypes } = require('sequelize');
            const [clgCol] = await sequelize.query(
                "SHOW COLUMNS FROM programs WHERE Field = 'clg_ids'",
                { type: QueryTypes.SELECT }
            );
            if (!clgCol) {
                await sequelize.query("ALTER TABLE programs ADD COLUMN clg_ids JSON NULL");
                console.log('🛠️  Added programs.clg_ids column');
            }
            const [courseCol] = await sequelize.query(
                "SHOW COLUMNS FROM programs WHERE Field = 'course_id'",
                { type: QueryTypes.SELECT }
            );
            if (!courseCol) {
                await sequelize.query("ALTER TABLE programs ADD COLUMN course_id INT NULL");
                console.log('🛠️  Added programs.course_id column');
            }
            const [courseIdsCol] = await sequelize.query(
                "SHOW COLUMNS FROM programs WHERE Field = 'course_ids'",
                { type: QueryTypes.SELECT }
            );
            if (!courseIdsCol) {
                await sequelize.query("ALTER TABLE programs ADD COLUMN course_ids JSON NULL");
                console.log('🛠️  Added programs.course_ids column');
            }
            // batch_ids: JSON array of batch ids the program is scoped to.
            // Added so Add/Edit Program can save batch scope alongside the
            // existing college + course scope.
            const [batchIdsCol] = await sequelize.query(
                "SHOW COLUMNS FROM programs WHERE Field = 'batch_ids'",
                { type: QueryTypes.SELECT }
            );
            if (!batchIdsCol) {
                await sequelize.query("ALTER TABLE programs ADD COLUMN batch_ids JSON NULL");
                console.log('🛠️  Added programs.batch_ids column');
            }
            // course_clg_pairs: JSON array of { courseId, clgId } so a course
            // can be picked for one college but not another. course_ids stays
            // populated with the distinct union for back-compat.
            const [coursePairsCol] = await sequelize.query(
                "SHOW COLUMNS FROM programs WHERE Field = 'course_clg_pairs'",
                { type: QueryTypes.SELECT }
            );
            if (!coursePairsCol) {
                await sequelize.query("ALTER TABLE programs ADD COLUMN course_clg_pairs JSON NULL");
                console.log('🛠️  Added programs.course_clg_pairs column');
            }
        } catch (e) {
            console.warn('[programs] column check failed:', e.message);
        }

        // program_requests: created here when missing (fresh DB / new RDS
        // migration). Holds the admin→student program assignment + the
        // student's accept/reject response. UNIQUE(user_id) backs the
        // ON DUPLICATE KEY UPDATE upsert in StudentService.
        try {
            const { QueryTypes } = require('sequelize');
            const authDb = require('./config/authDatabase');
            await authDb.query(`
                CREATE TABLE IF NOT EXISTS program_requests (
                    id           INT AUTO_INCREMENT PRIMARY KEY,
                    user_id      VARCHAR(255) NOT NULL,
                    program      VARCHAR(255) NOT NULL,
                    requested_by VARCHAR(255) NULL,
                    status       VARCHAR(32)  NOT NULL DEFAULT 'sent',
                    responded_at DATETIME     NULL,
                    created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    UNIQUE KEY uq_program_requests_user (user_id)
                ) ENGINE=InnoDB`);
        } catch (e) {
            console.warn('[program_requests] table ensure skipped:', e.message);
        }

        // users (auth DB) program-response mirror columns. StudentService
        // writes assignedProgram / programResponseStatus / programRespondedAt
        // when a request is sent or answered; on a fresh DB these don't exist.
        try {
            const { QueryTypes } = require('sequelize');
            const authDb = require('./config/authDatabase');
            const wanted = [
                ['assignedProgram',       'VARCHAR(255) NULL'],
                ['programResponseStatus', 'VARCHAR(32) NULL'],
                ['programRespondedAt',    'DATETIME NULL'],
            ];
            for (const [field, ddl] of wanted) {
                const [col] = await authDb.query(
                    'SHOW COLUMNS FROM users WHERE Field = :field',
                    { replacements: { field }, type: QueryTypes.SELECT }
                );
                if (!col) {
                    await authDb.query(`ALTER TABLE users ADD COLUMN ${field} ${ddl}`);
                    console.log(`🛠️  Added users.${field} column (auth DB)`);
                }
            }
        } catch (e) {
            console.warn('[users] program-response columns check skipped:', e.message);
        }

        // program_requests.program: was an ENUM of 3 hardcoded strings;
        // widen to VARCHAR so admin-created program titles (from Manage
        // Programs) fit. Same idempotent ALTER pattern the other migrations
        // use. Skipped silently when the column is already VARCHAR.
        try {
            const { QueryTypes } = require('sequelize');
            const authDb = require('./config/authDatabase');
            const [col] = await authDb.query(
                "SHOW COLUMNS FROM program_requests WHERE Field = 'program'",
                { type: QueryTypes.SELECT }
            );
            if (col && /^enum/i.test(col.Type)) {
                await authDb.query(
                    'ALTER TABLE program_requests MODIFY COLUMN program VARCHAR(255) NOT NULL'
                );
                console.log('🛠️  Widened program_requests.program ENUM → VARCHAR(255) (auth DB)');
            }
        } catch (e) {
            console.warn('[program_requests] program column widen skipped:', e.message);
        }

        // colleges.isActive: per-college access toggle driven from Manage
        // Colleges → Options → Revoke / Give Access. Lives in the auth DB
        // alongside the rest of the College row. Default 1 so pre-existing
        // colleges remain accessible until explicitly revoked.
        try {
            const { QueryTypes } = require('sequelize');
            const authDb = require('./config/authDatabase');
            const [col] = await authDb.query(
                "SHOW COLUMNS FROM colleges WHERE Field = 'isActive'",
                { type: QueryTypes.SELECT }
            );
            if (!col) {
                await authDb.query(
                    'ALTER TABLE colleges ADD COLUMN isActive TINYINT(1) NOT NULL DEFAULT 1'
                );
                console.log('🛠️  Added colleges.isActive column (auth DB)');
            }
        } catch (e) {
            console.warn('[colleges] isActive column check failed:', e.message);
        }

        // live_classes.user_id holds 11-digit auth-service userIds which
        // exceed signed-INT max (2147483647). Older schema created the column
        // as INT, which silently clamps the id and breaks the host lookup
        // (the instructor name shows blank). Idempotently widen it to BIGINT.
        try {
            const { QueryTypes } = require('sequelize');
            const [col] = await sequelize.query(
                "SHOW COLUMNS FROM live_classes WHERE Field = 'user_id'",
                { type: QueryTypes.SELECT }
            );
            if (col && /^int/i.test(col.Type)) {
                await sequelize.query('ALTER TABLE live_classes MODIFY COLUMN user_id BIGINT NULL');
                console.log('🛠️  Widened live_classes.user_id INT → BIGINT');
            }
        } catch (e) {
            console.warn('[live-classes] user_id column check failed:', e.message);
        }

        // live_classes.recordings holds an optional recording link for a past
        // session, shown to students in the course-player "Live class" table.
        // Idempotently add the column on older schemas that predate it.
        try {
            const { QueryTypes } = require('sequelize');
            const [col] = await sequelize.query(
                "SHOW COLUMNS FROM live_classes WHERE Field = 'recordings'",
                { type: QueryTypes.SELECT }
            );
            if (!col) {
                await sequelize.query('ALTER TABLE live_classes ADD COLUMN recordings VARCHAR(1000) NULL');
                console.log('🛠️  Added live_classes.recordings column');
            }
        } catch (e) {
            console.warn('[live-classes] recordings column check failed:', e.message);
        }
    })
    .then(start)
    .catch((err) => {
        console.warn('DB connection failed:', err.message);
        console.warn('Starting server anyway — list endpoints will return empty results until the DB is reachable.');
        start();
    });
