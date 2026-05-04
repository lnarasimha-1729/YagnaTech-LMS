const instructors = [
    {
        id: 1, name: 'Alex Johnson', email: 'alex@example.com', role: 'instructor',
        photo: 'https://i.pravatar.cc/200?img=12',
        biography: '<p>Senior frontend engineer with 12 years of experience building production React applications.</p>',
        about: 'Frontend engineer & educator',
        skills: 'React, TypeScript, Node.js',
    },
    {
        id: 2, name: 'Priya Sharma', email: 'priya@example.com', role: 'instructor',
        photo: 'https://i.pravatar.cc/200?img=47',
        biography: '<p>Backend specialist focused on Node.js, PostgreSQL, and distributed systems.</p>',
        about: 'Backend & systems engineer',
        skills: 'Node.js, PostgreSQL, AWS',
    },
];

const categories = [
    { id: 1, title: 'Web Development', slug: 'web-development' },
    { id: 2, title: 'Data Science', slug: 'data-science' },
];

const courses = [
    {
        id: 101,
        user_id: 1,
        category_id: 1,
        title: 'Mastering React 18',
        slug: 'mastering-react-18',
        short_description: 'Build modern React apps with Hooks, Suspense, and Server Components.',
        description: '<p>This course covers everything you need to know about <strong>React 18</strong>, including hooks, concurrent rendering, suspense, and the new server components.</p><ul><li>Hands-on projects</li><li>Real-world patterns</li><li>Performance tuning</li></ul>',
        requirements: JSON.stringify(['Basic JavaScript knowledge', 'A code editor (VS Code recommended)', 'Node.js 18+ installed']),
        outcomes: JSON.stringify(['Build production React apps', 'Use Hooks effectively', 'Optimize app performance', 'Write maintainable component code']),
        faqs: JSON.stringify([
            { title: 'Do I need React experience?', description: 'Some basic JS is enough — we start from React fundamentals.' },
            { title: 'Are projects included?', description: 'Yes, three full projects are included with downloadable code.' },
        ]),
        language: 'english',
        level: 'intermediate',
        is_paid: 1,
        price: 49.99,
        discount_flag: 1,
        discounted_price: 29.99,
        thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=900&q=80',
        banner: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=1600&q=80',
        preview: 'https://www.youtube.com/embed/Ke90Tje7VS0',
        status: 'active',
        enable_drip_content: 0,
        drip_content_settings: JSON.stringify({
            locked_lesson_message: '<h3 style="text-align:center"><strong>Permission denied!</strong></h3><p style="text-align:center">Complete the previous lessons to unlock this one.</p>',
        }),
    },
    {
        id: 102,
        user_id: 2,
        category_id: 1,
        title: 'Node.js & Express Fundamentals',
        slug: 'node-express-fundamentals',
        short_description: 'Learn server-side JavaScript with Node, Express, and SQL.',
        description: '<p>From zero to deploying a production REST API with Node.js, Express and Sequelize.</p>',
        requirements: JSON.stringify(['JavaScript basics', 'Familiarity with the terminal']),
        outcomes: JSON.stringify(['Build REST APIs', 'Use Sequelize ORM', 'Authenticate users with JWT']),
        faqs: JSON.stringify([{ title: 'Database needed?', description: 'We use SQLite for development and MySQL for production.' }]),
        language: 'english',
        level: 'beginner',
        is_paid: 1,
        price: 39.99,
        discount_flag: 0,
        discounted_price: 0,
        thumbnail: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=900&q=80',
        banner: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=1600&q=80',
        preview: '',
        status: 'active',
        enable_drip_content: 0,
        drip_content_settings: '{}',
    },
    {
        id: 103,
        user_id: 1,
        category_id: 2,
        title: 'Free HTML & CSS Crash Course',
        slug: 'free-html-css-crash-course',
        short_description: 'A free 2-hour intro to building static websites.',
        description: '<p>Get started with HTML5 and CSS3 in this free crash course.</p>',
        requirements: JSON.stringify(['No prior knowledge needed']),
        outcomes: JSON.stringify(['Write semantic HTML', 'Style with CSS', 'Build a small portfolio site']),
        faqs: JSON.stringify([]),
        language: 'english',
        level: 'beginner',
        is_paid: 0,
        price: 0,
        discount_flag: 0,
        discounted_price: 0,
        thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=900&q=80',
        banner: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1600&q=80',
        preview: '',
        status: 'active',
        enable_drip_content: 1,
        drip_content_settings: JSON.stringify({
            locked_lesson_message: '<h3 style="text-align:center"><strong>Permission denied!</strong></h3><p style="text-align:center">This course supports drip content, so you must complete the previous lessons.</p>',
        }),
    },
];

// Sections + lessons keyed by course_id, exercising every lesson type the player handles.
const sections = [
    { id: 1, course_id: 101, title: 'Getting Started', sort: 1 },
    { id: 2, course_id: 101, title: 'Hooks Deep Dive', sort: 2 },
    { id: 3, course_id: 102, title: 'Node.js Foundations', sort: 1 },
    { id: 4, course_id: 102, title: 'Building APIs', sort: 2 },
    { id: 5, course_id: 103, title: 'HTML Basics', sort: 1 },
    { id: 6, course_id: 103, title: 'CSS Styling', sort: 2 },
];

const lessons = [
    // Course 101 — Mastering React 18
    {
        id: 1001, course_id: 101, section_id: 1, sort: 1, title: 'Welcome & introduction',
        lesson_type: 'video-url', video_type: 'youtube',
        lesson_src: 'https://www.youtube.com/embed/Ke90Tje7VS0',
        duration: '00:04:32', summary: '<p>Quick tour of what you will build.</p>',
        attachment: '', attachment_type: '', is_free: 1,
    },
    {
        id: 1002, course_id: 101, section_id: 1, sort: 2, title: 'Setting up the project',
        lesson_type: 'text', video_type: '',
        lesson_src: '',
        duration: '00:08:00',
        summary: '<p>Reading: project setup steps.</p>',
        attachment: '<h3>Setup steps</h3><ol><li>Install Node 18+</li><li>Run <code>npm create vite@latest</code></li><li>Pick the React template</li></ol>',
        attachment_type: 'text', is_free: 0,
    },
    {
        id: 1003, course_id: 101, section_id: 2, sort: 1, title: 'useState & useEffect',
        lesson_type: 'video-url', video_type: 'youtube',
        lesson_src: 'https://www.youtube.com/embed/O6P86uwfdR0',
        duration: '00:14:22', summary: '<p>Hands-on with useState and useEffect.</p>',
        attachment: '', attachment_type: '', is_free: 0,
    },
    {
        id: 1004, course_id: 101, section_id: 2, sort: 2, title: 'Custom hooks pattern',
        lesson_type: 'document_type', video_type: '',
        lesson_src: 'https://www.africau.edu/images/default/sample.pdf',
        duration: '00:00:00', summary: '<p>PDF reading: extracting hook patterns.</p>',
        attachment: 'https://www.africau.edu/images/default/sample.pdf',
        attachment_type: 'pdf', is_free: 0,
    },
    // Course 102 — Node & Express
    {
        id: 2001, course_id: 102, section_id: 3, sort: 1, title: 'Why Node.js?',
        lesson_type: 'video-url', video_type: 'youtube',
        lesson_src: 'https://www.youtube.com/embed/TlB_eWDSMt4',
        duration: '00:09:11', summary: '<p>Node.js philosophy and event loop.</p>',
        attachment: '', attachment_type: '', is_free: 1,
    },
    {
        id: 2002, course_id: 102, section_id: 4, sort: 1, title: 'Building your first route',
        lesson_type: 'text', video_type: '',
        lesson_src: '',
        duration: '00:06:00', summary: '<p>Reading: Express route handlers.</p>',
        attachment: '<p>Use <code>app.get(\'/\', handler)</code> to define routes.</p><pre>const express = require(\'express\');\nconst app = express();\napp.get(\'/\', (req,res)=>res.send(\'hi\'));</pre>',
        attachment_type: 'text', is_free: 0,
    },
    {
        id: 2003, course_id: 102, section_id: 4, sort: 2, title: 'A quick poll',
        lesson_type: 'quiz', video_type: '',
        lesson_src: '',
        duration: '00:05:00', summary: '<p>Test your understanding.</p>',
        attachment: JSON.stringify({
            questions: [
                { q: 'Express is a Node.js framework.', options: ['True', 'False'], answer: 0 },
                { q: 'Which method handles GET requests?', options: ['app.post', 'app.get', 'app.use'], answer: 1 },
            ],
        }),
        attachment_type: 'quiz', is_free: 0,
    },
    // Course 103 — HTML & CSS
    {
        id: 3001, course_id: 103, section_id: 5, sort: 1, title: 'HTML elements overview',
        lesson_type: 'video-url', video_type: 'youtube',
        lesson_src: 'https://www.youtube.com/embed/qz0aGYrrlhU',
        duration: '00:12:00', summary: '<p>The most useful tags in HTML.</p>',
        attachment: '', attachment_type: '', is_free: 1,
    },
    {
        id: 3002, course_id: 103, section_id: 6, sort: 1, title: 'Selectors & specificity',
        lesson_type: 'text', video_type: '',
        lesson_src: '',
        duration: '00:07:00', summary: '<p>Reading material on CSS selectors.</p>',
        attachment: '<p>Specificity is calculated as <code>(inline, ids, classes, types)</code>.</p>',
        attachment_type: 'text', is_free: 0,
    },
];

const reviews = [
    { id: 1, course_id: 101, user_id: 2, rating: 5, review: 'One of the best React courses I\'ve taken.', user: instructors[1] },
    { id: 2, course_id: 101, user_id: 2, rating: 4, review: 'Great hands-on examples.', user: instructors[1] },
    { id: 3, course_id: 102, user_id: 1, rating: 5, review: 'Concise and very practical.', user: instructors[0] },
];

const enrollments = [
    { id: 1, course_id: 101, user_id: 99 },
    { id: 2, course_id: 102, user_id: 99 },
];

const watchStore = require('./watchStore');

const findCourse = (idOrSlug) =>
    courses.find((c) => String(c.id) === String(idOrSlug) || c.slug === String(idOrSlug));

const sectionsForCourse = (courseId) =>
    sections
        .filter((s) => s.course_id === Number(courseId))
        .sort((a, b) => a.sort - b.sort)
        .map((s) => ({
            ...s,
            lessons: lessons
                .filter((l) => l.section_id === s.id)
                .sort((a, b) => a.sort - b.sort),
        }));

const lessonsForCourse = (courseId) =>
    lessons.filter((l) => l.course_id === Number(courseId));

const enrichCourse = (course) => {
    const creator = instructors.find((i) => i.id === course.user_id) || null;
    const category = categories.find((c) => c.id === course.category_id) || null;
    const courseLessons = lessonsForCourse(course.id);
    const courseSections = sectionsForCourse(course.id);
    const courseReviews = reviews.filter((r) => r.course_id === course.id);
    const totalRating = courseReviews.reduce((s, r) => s + r.rating, 0);
    const averageRating = courseReviews.length ? totalRating / courseReviews.length : 0;
    const enrolled = enrollments.filter((e) => e.course_id === course.id).length;
    const totalDurationSecs = courseLessons.reduce((s, l) => {
        const parts = String(l.duration || '00:00:00').split(':').map(Number);
        return s + (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);
    }, 0);
    return {
        ...course,
        creator, category,
        sections: courseSections,
        lesson_count: courseLessons.length,
        section_count: courseSections.length,
        enrolled,
        total_rating: totalRating,
        review_count: courseReviews.length,
        average_rating: Math.round(averageRating * 10) / 10,
        total_duration_secs: totalDurationSecs,
    };
};

const getCourses = (query = {}) => {
    const { search, category, price, page = 1 } = query;
    let rows = [...courses];
    if (search) {
        const q = String(search).toLowerCase();
        rows = rows.filter((c) => c.title.toLowerCase().includes(q));
    }
    if (category && category !== 'all') {
        const cat = categories.find((c) => c.slug === category);
        if (cat) rows = rows.filter((c) => c.category_id === cat.id);
    }
    if (price === 'free') rows = rows.filter((c) => c.is_paid === 0);
    if (price === 'paid') rows = rows.filter((c) => c.is_paid === 1);

    const perPage = 12;
    const total = rows.length;
    const current = Number(page) || 1;
    const lastPage = Math.max(1, Math.ceil(total / perPage));
    const offset = (current - 1) * perPage;
    const data = rows.slice(offset, offset + perPage).map(enrichCourse);
    return {
        data, total, per_page: perPage, current_page: current, last_page: lastPage,
        categories,
    };
};

const getCourseDetails = (idOrSlug) => {
    const course = findCourse(idOrSlug);
    if (!course) return null;
    const enriched = enrichCourse(course);
    const courseReviews = reviews.filter((r) => r.course_id === course.id);
    const instructorReviews = []; // mirrors empty for now
    return {
        course: enriched,
        reviews: courseReviews,
        instructor_reviews: instructorReviews,
    };
};

const getPlayerData = (slug, lessonId, userId = 99) => {
    const course = findCourse(slug);
    if (!course) return null;
    const enriched = enrichCourse(course);

    let lesson;
    if (lessonId) {
        lesson = lessons.find((l) => l.id === Number(lessonId) && l.course_id === course.id);
    }
    if (!lesson) {
        const courseLessons = lessonsForCourse(course.id).sort((a, b) => a.sort - b.sort);
        lesson = courseLessons[0] || null;
    }

    const history = watchStore.getHistory(course.id, userId)
        || { course_id: course.id, student_id: userId, watching_lesson_id: lesson?.id, completed_lesson: [] };

    const completedIds = Array.isArray(history.completed_lesson) ? history.completed_lesson : [];
    const totalLessons = enriched.lesson_count;
    const progress = totalLessons ? Math.round((completedIds.length / totalLessons) * 100) : 0;

    // Drip-content lock evaluation: a lesson is locked once we hit the first incomplete lesson before it.
    const lockedLessonIds = [];
    if (course.enable_drip_content) {
        let blocked = false;
        for (const sec of enriched.sections) {
            for (const l of sec.lessons) {
                if (blocked) {
                    lockedLessonIds.push(l.id);
                } else if (!completedIds.includes(l.id)) {
                    // first incomplete lesson is unlocked, but everything after is locked
                    blocked = true;
                }
            }
        }
    }

    return {
        course: enriched,
        lesson,
        history: {
            ...history,
            completed_lesson: completedIds,
        },
        completed_lesson_count: completedIds.length,
        progress,
        locked_lesson_ids: lockedLessonIds,
    };
};

const markLessonComplete = (courseId, lessonId, userId = 99) =>
    watchStore.markLessonComplete(courseId, lessonId, userId);

// Parse a "HH:MM:SS" duration string into seconds. Returns 0 if unparseable.
const durationToSeconds = (raw) => {
    const parts = String(raw || '00:00:00').split(':').map((x) => Number(x) || 0);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return parts[0] || 0;
};

// Mark progress at currentDuration (seconds). Mirrors the Laravel rule from
// HomeController::update_watch_history_with_duration: a lesson is auto-completed
// once watched seconds >= 30% of total duration. Drip-content courses use their
// own admin-configured threshold; otherwise the 30% rule is the default.
const markProgress = (courseId, lessonId, currentDuration, userId = 99) => {
    courseId = Number(courseId);
    lessonId = Number(lessonId);
    const seconds = Math.max(0, Math.floor(Number(currentDuration) || 0));

    const row = watchStore.upsertDuration(courseId, lessonId, userId, seconds);
    const watchedSeconds = row.current_duration;

    const lesson = lessons.find((l) => l.id === lessonId);
    const course = courses.find((c) => c.id === courseId);
    const totalSeconds = lesson ? durationToSeconds(lesson.duration) : 0;

    let isCompleted = 0;
    if (course && course.enable_drip_content === 1) {
        const drip = (() => {
            try {
                return typeof course.drip_content_settings === 'string'
                    ? JSON.parse(course.drip_content_settings)
                    : (course.drip_content_settings || {});
            } catch { return {}; }
        })();
        if (drip.lesson_completion_role === 'duration') {
            if (watchedSeconds >= Number(drip.minimum_duration || 0)) isCompleted = 1;
            else if (totalSeconds > 0 && watchedSeconds + 4 >= totalSeconds) isCompleted = 1;
        } else {
            const required = (totalSeconds / 100) * Number(drip.minimum_percentage || 30);
            if (watchedSeconds >= required) isCompleted = 1;
            else if (totalSeconds > 0 && watchedSeconds + 4 >= totalSeconds) isCompleted = 1;
        }
    } else if (totalSeconds > 0) {
        // Default rule: 30% watched -> completed.
        if (watchedSeconds >= totalSeconds * 0.30) isCompleted = 1;
    }

    let history = null;
    if (isCompleted) {
        history = markLessonComplete(courseId, lessonId, userId);
    }

    return {
        lesson_id: lessonId,
        current_duration: seconds,
        watched_seconds: watchedSeconds,
        total_seconds: totalSeconds,
        is_completed: isCompleted,
        history,
    };
};

const setWatchingLesson = (courseId, lessonId, userId = 99) =>
    watchStore.setWatchingLesson(courseId, lessonId, userId);

module.exports = {
    getCourses, getCourseDetails, getPlayerData,
    markLessonComplete, setWatchingLesson, markProgress,
};
