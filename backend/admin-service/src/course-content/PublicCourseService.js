const courseRepo = require('../repositories/CourseRepository');
const sectionRepo = require('../repositories/SectionRepository');
const lessonRepo = require('../repositories/LessonRepository');
const { User, Course } = require('../models');
const watchStore = require('./watchStore');

const safeJSON = (raw, fallback) => {
    if (raw == null) return fallback;
    if (typeof raw !== 'string') return raw;
    try { return JSON.parse(raw); } catch { return fallback; }
};

const sumLessonSeconds = (lessons) =>
    lessons.reduce((sum, l) => {
        const dur = l.duration || '00:00:00';
        const [h, m, s] = String(dur).split(':').map((x) => Number(x) || 0);
        return sum + (h || 0) * 3600 + (m || 0) * 60 + (s || 0);
    }, 0);

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
        thumbnail: c.thumbnail || '',
        banner: c.banner || c.thumbnail || '',
        preview: c.preview || '',
        status: c.status,
        enrolled: 0,
        review_count: 0,
        average_rating: 0,
        section_count: sections.length,
        lesson_count: lessons.length,
        total_duration_secs: sumLessonSeconds(lessons),
        sections: sectionPayload,
        creator: creator
            ? {
                id: creator.id,
                name: creator.name,
                email: creator.email,
                photo: creator.photo || `https://i.pravatar.cc/200?u=${creator.id}`,
                about: creator.about || '',
                biography: creator.biography || '',
                skills: creator.skills || '',
            }
            : null,
    };
};

const list = async (query = {}) => {
    const limit = 12;
    const page = Number(query.page) || 1;
    const offset = (page - 1) * limit;

    const { count, rows } = await Course.findAndCountAll({
        where: { status: 'active' },
        order: [['id', 'DESC']],
        limit,
        offset,
    });

    return {
        data: rows.map((r) => sanitizeCourse(r)),
        total: count,
        per_page: limit,
        current_page: page,
        last_page: Math.max(1, Math.ceil(count / limit)),
        categories: [],
    };
};

const detailsBySlug = async (slug) => {
    const course = await Course.findOne({ where: { slug } });
    if (!course) return null;

    const sections = await sectionRepo.findByCourse(course.id);
    const sectionIds = sections.map((s) => s.id);
    const lessons = await lessonRepo.findBySectionIds(sectionIds);
    const creator = course.user_id ? await User.findByPk(course.user_id) : null;

    return {
        course: sanitizeCourse(course, sections, lessons, creator),
        reviews: [],
    };
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
    const creator = course.user_id ? await User.findByPk(course.user_id) : null;
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
            duration: currentLessonRow.duration || '00:00:00',
            lesson_type: currentLessonRow.lesson_type,
            is_free: currentLessonRow.is_free || 0,
            lesson_src: currentLessonRow.lesson_src || '',
            attachment: currentLessonRow.attachment || '',
            description: currentLessonRow.description || '',
            sort: currentLessonRow.sort,
        }
        : null;

    const userId = Number(userIdRaw) > 0 ? Number(userIdRaw) : 0;
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

module.exports = { list, detailsBySlug, detailsFirstActive, playerData };
