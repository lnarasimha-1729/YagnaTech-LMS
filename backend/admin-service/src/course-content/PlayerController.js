const mockData = require('./mockData');
const lessonRepo = require('../repositories/LessonRepository');
const { Course } = require('../models');

// Parse "HH:MM:SS" (or "MM:SS"/"SS") into seconds. Mirrors mockData's parser.
const durationToSeconds = (raw) => {
    const parts = String(raw || '00:00:00').split(':').map((x) => Number(x) || 0);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return parts[0] || 0;
};

// Resolve the real lesson duration + course drip settings from the DB so the
// completion rule (minimum_duration / percentage_watched) is evaluated against
// actual data, not the in-memory mock arrays. Returns null if the lesson isn't
// a real DB row (then markProgress falls back to its mock/default behaviour).
const resolveRealCtx = async (courseId, lessonId) => {
    try {
        const lesson = await lessonRepo.findById(Number(lessonId));
        if (!lesson) return null;
        const course = await Course.findByPk(Number(courseId));
        let drip = {};
        if (course && course.drip_content_settings) {
            try {
                drip = typeof course.drip_content_settings === 'string'
                    ? JSON.parse(course.drip_content_settings)
                    : course.drip_content_settings;
            } catch { drip = {}; }
        }
        return {
            totalSeconds: durationToSeconds(lesson.duration),
            enableDrip: course && course.enable_drip_content ? 1 : 0,
            drip,
        };
    } catch (e) {
        console.warn('[player] resolveRealCtx failed:', e.message);
        return null;
    }
};

// Resolves the student making the request. Returns 0 (falsy) if missing — callers
// must check and reject rather than silently bucketing into a default user.
const getUserId = (req) => {
    const raw = req.headers['x-user-id'] || req.query.user_id || req.body?.user_id;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : 0;
};

exports.player = async (req, res) => {
    const { slug } = req.params;
    const { lesson_id } = req.query;
    try {
        const data = mockData.getPlayerData(slug, lesson_id, getUserId(req));
        if (!data) return res.status(404).json({ error: 'Course not found' });
        // also persist watching_lesson_id when a lesson is viewed
        if (data.lesson) mockData.setWatchingLesson(data.course.id, data.lesson.id, getUserId(req));
        return res.json(data);
    } catch (err) {
        console.warn('[player] failed:', err.message);
        return res.status(500).json({ error: 'Failed to load player' });
    }
};

exports.complete = async (req, res) => {
    const { course_id, lesson_id } = req.body;
    if (!course_id || !lesson_id) return res.status(422).json({ error: 'course_id and lesson_id are required' });
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'user not identified — send x-user-id header' });
    try {
        const h = mockData.markLessonComplete(course_id, lesson_id, userId);
        return res.json({ success: 'Lesson marked complete', history: h });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

// Player posts current playback time every ~5s. Server tallies watched seconds and
// auto-marks the lesson complete once >= 30% of total duration is reached.
exports.progress = async (req, res) => {
    const { course_id, lesson_id, current_duration } = req.body;
    if (!course_id || !lesson_id) return res.status(422).json({ error: 'course_id and lesson_id are required' });
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'user not identified — send x-user-id header' });
    try {
        const realCtx = await resolveRealCtx(course_id, lesson_id);
        const result = mockData.markProgress(course_id, lesson_id, current_duration, userId, realCtx);
        return res.json(result);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};
