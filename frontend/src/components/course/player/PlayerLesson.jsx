import QuizPlayer from './QuizPlayer';

const LessonTypeIcon = ({ type }) => {
    if (['video-url', 'system-video', 'vimeo-url', 'html5'].includes(type)) return <i className="fa fa-video" />;
    if (type === 'image') return <i className="fa fa-image" />;
    if (type === 'google_drive') return <i className="fab fa-google-drive" />;
    if (type === 'quiz') return <i className="fa fa-question-circle" />;
    return <i className="fa fa-file" />;
};

const vimeoIdFrom = (url) => {
    const m = String(url || '').match(/vimeo\.com\/(\d+)/);
    return m ? m[1] : '';
};

const toYouTubeEmbed = (url) => {
    const u = String(url || '');
    if (u.includes('/embed/')) return u;
    const watchMatch = u.match(/[?&]v=([A-Za-z0-9_-]{11})/);
    if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`;
    const shortMatch = u.match(/youtu\.be\/([A-Za-z0-9_-]{11})/);
    if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;
    return u;
};

const isYouTube = (url) => /youtu/i.test(String(url || ''));

const googleIdFrom = (url) => {
    const u = String(url || '');
    const dMatch = u.match(/\/d\/([^\/]+)/);
    if (dMatch) return dMatch[1];
    const eqMatch = u.match(/[?&]id=([^&]+)/);
    return eqMatch ? eqMatch[1] : '';
};

export default function PlayerLesson({ lesson, course, locked, lockedMessage, onLessonEnded, onTimeUpdate }) {
    if (locked) {
        return (
            <div className="bg-black/30 rounded-xl p-12 text-center text-white/80 my-8">
                <i className="fa fa-lock text-[48px] mb-4 text-amber-300" />
                <div dangerouslySetInnerHTML={{ __html: lockedMessage || '<p>This lesson is locked. Complete the previous lesson to unlock it.</p>' }} />
            </div>
        );
    }

    if (!lesson) {
        return (
            <div className="aspect-video-shell bg-black/40 rounded-xl flex items-center justify-center text-white/60">
                Select a lesson to start
            </div>
        );
    }

    return (
        <div className="rounded-xl overflow-hidden bg-black mb-4">
            <LessonRenderer lesson={lesson} course={course} onLessonEnded={onLessonEnded} onTimeUpdate={onTimeUpdate} />
        </div>
    );
}

function LessonRenderer({ lesson, course, onLessonEnded, onTimeUpdate }) {
    const t = lesson.lesson_type;

    if (t === 'text') {
        return (
            <article className="bg-white text-dark p-6 prose-custom" dangerouslySetInnerHTML={{ __html: lesson.attachment || '' }} />
        );
    }

    if (t === 'video-url') {
        const src = isYouTube(lesson.lesson_src) ? toYouTubeEmbed(lesson.lesson_src) : lesson.lesson_src;
        return (
            <div className="aspect-video-shell">
                <iframe
                    src={src}
                    allow="autoplay; encrypted-media; fullscreen"
                    allowFullScreen
                    className="w-full h-full"
                    title={lesson.title}
                />
            </div>
        );
    }

    if (t === 'system-video' || t === 'html5') {
        return (
            <video
                key={lesson.id}
                playsInline
                controls
                onContextMenu={(e) => e.preventDefault()}
                onEnded={onLessonEnded}
                onTimeUpdate={(e) => onTimeUpdate?.(e.currentTarget.currentTime)}
                className="w-full max-h-[80vh] bg-black"
            >
                <source src={lesson.lesson_src} type="video/mp4" />
            </video>
        );
    }

    if (t === 'vimeo-url') {
        const vid = vimeoIdFrom(lesson.lesson_src);
        return (
            <div className="aspect-video-shell">
                <iframe
                    src={`https://player.vimeo.com/video/${vid}?title=0&byline=0&portrait=0`}
                    allow="autoplay; fullscreen"
                    allowFullScreen
                    className="w-full h-full"
                    title={lesson.title}
                />
            </div>
        );
    }

    if (t === 'google_drive') {
        const id = googleIdFrom(lesson.lesson_src);
        return (
            <div className="aspect-video-shell bg-black">
                <iframe
                    src={`https://drive.google.com/file/d/${id}/preview`}
                    allow="autoplay"
                    allowFullScreen
                    className="w-full h-full"
                    title={lesson.title}
                />
            </div>
        );
    }

    if (t === 'image') {
        return <img src={lesson.attachment || lesson.lesson_src} alt={lesson.title} className="w-full max-h-[80vh] object-contain bg-black" />;
    }

    if (t === 'document_type') {
        const src = lesson.lesson_src || lesson.attachment;
        if (lesson.attachment_type === 'pdf') {
            return <iframe src={src} className="w-full h-[80vh] bg-white" title={lesson.title} />;
        }
        if (['doc', 'ppt'].includes(lesson.attachment_type)) {
            return (
                <iframe
                    src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(src)}`}
                    className="w-full h-[80vh] bg-white"
                    title={lesson.title}
                />
            );
        }
        return <iframe src={src} className="w-full h-[80vh] bg-white" title={lesson.title} />;
    }

    if (t === 'quiz') {
        return <QuizPlayer lesson={lesson} />;
    }

    if (t === 'iframe' || t === 'scorm') {
        return (
            <div className="aspect-video-shell">
                <iframe src={lesson.lesson_src} allowFullScreen className="w-full h-full bg-white" title={lesson.title} />
            </div>
        );
    }

    return (
        <div className="bg-black/40 p-6 text-white/70 text-center">
            Unsupported lesson type: <code className="text-white">{t}</code>
        </div>
    );
}

export { LessonTypeIcon };
