const path = require('path');
const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const { sequelize } = require('./models');
const { adminOnly, auth } = require('./middlewares/auth');
const { errorHandler } = require('./middlewares/error');

const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const categoryRoutes = require('./routes/category.routes');
const courseRoutes = require('./routes/course.routes');
const curriculumRoutes = require('./routes/curriculum.routes');
const quizRoutes = require('./routes/quiz.routes');
const liveClassRoutes = require('./routes/liveclass.routes');
const couponRoutes = require('./routes/coupon.routes');
const certificateRoutes = require('./routes/certificate.routes');
const collegeDashboardRoutes = require('./routes/collegeDashboard.routes');
const studentRoutes = require('./routes/student.routes');
const preAssessmentRoutes = require('./routes/preassessment.routes');

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(path.join(__dirname, '..', env.uploadDir)));

app.get(['/api/health', '/health'], (_req, res) => res.json({ ok: true, service: 'admin-service' }));

// Public read-only endpoints — no auth required
const categoryService = require('./services/CategoryService');
app.get('/api/public/categories', async (_req, res, next) => {
    try { res.json(await categoryService.list()); } catch (e) { next(e); }
});

// Course content endpoints — real DB first, mock fallback
const courseContentCtrl = require('./course-content/CourseController');
const playerCtrl = require('./course-content/PlayerController');
const publicCourseService = require('./course-content/PublicCourseService');

app.get('/api/public/courses', async (req, res, next) => {
    try {
        const real = await publicCourseService.list(req.query);
        if (real?.data?.length) return res.json(real);
        return courseContentCtrl.list(req, res, next);
    } catch (e) {
        console.warn('[public/courses] DB failed, falling back to mock:', e.message);
        return courseContentCtrl.list(req, res, next);
    }
});

app.get('/api/public/course/:slug', async (req, res, next) => {
    try {
        const real = req.params.slug === 'first'
            ? await publicCourseService.detailsFirstActive()
            : await publicCourseService.detailsBySlug(req.params.slug);
        if (real) return res.json(real);
        return courseContentCtrl.details(req, res, next);
    } catch (e) {
        console.warn('[public/course] DB failed, falling back to mock:', e.message);
        return courseContentCtrl.details(req, res, next);
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

// Protected admin endpoints — adminOnly enforces JWT + role
app.use('/api/admin', adminOnly, adminRoutes);
app.use('/api/admin', adminOnly, categoryRoutes);
app.use('/api/admin', adminOnly, courseRoutes);
app.use('/api/admin', adminOnly, curriculumRoutes);
app.use('/api/admin', adminOnly, quizRoutes);
app.use('/api/admin', adminOnly, liveClassRoutes);
app.use('/api/admin', adminOnly, couponRoutes);
app.use('/api/admin', adminOnly, certificateRoutes);
app.use('/api/admin', adminOnly, collegeDashboardRoutes);
app.use('/api/admin', adminOnly, studentRoutes);

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
    })
    .then(start)
    .catch((err) => {
        console.warn('DB connection failed:', err.message);
        console.warn('Starting server anyway — list endpoints will return empty results until the DB is reachable.');
        start();
    });
