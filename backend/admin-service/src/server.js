const path = require('path');
const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const { sequelize } = require('./models');
const { adminOnly, auth, adminOrInstructor } = require('./middlewares/auth');
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
const certificateRoutes = require('./routes/certificate.routes');
const collegeDashboardRoutes = require('./routes/collegeDashboard.routes');
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

// Protected admin endpoints — adminOnly enforces JWT + role
app.use('/api/admin', adminOnly, adminRoutes);
app.use('/api/admin', adminOnly, quizRoutes);
app.use('/api/admin', adminOnly, liveClassRoutes);
app.use('/api/admin', adminOnly, couponRoutes);
app.use('/api/admin', adminOnly, certificateRoutes);
app.use('/api/admin', adminOnly, collegeDashboardRoutes);
app.use('/api/admin', adminOnly, collegeRoutes);
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
        } catch (e) {
            console.warn('[auth-db] photo column check failed:', e.message);
        }

        try {
            const { Language } = require('./models');
            await Language.sync();
        } catch (e) {
            console.warn('[languages] table sync failed:', e.message);
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
    })
    .then(start)
    .catch((err) => {
        console.warn('DB connection failed:', err.message);
        console.warn('Starting server anyway — list endpoints will return empty results until the DB is reachable.');
        start();
    });
