import { useState } from 'react';
import QuizPlayer from './QuizPlayer';

// Same env var the rest of the app uses (Home/Overview/Programspage). System
// videos and uploaded documents are persisted as RELATIVE paths
// ("uploads/lesson_file/videos/foo.mp4") by CurriculumService, so they need
// the admin-service origin prepended before they're resolvable in <video>.
const ADMIN_BASE = (import.meta.env.VITE_ADMIN_API_URL) || 'http://localhost:4000';

// Force-download a remote file as a true browser download. The HTML5
// `download` attribute is ignored for cross-origin URLs (frontend on :8080,
// admin-service on :4000), so a plain <a download> just opens the PDF in a
// new tab. Fetch the bytes, wrap them in a blob URL (same-origin), and
// click a synthetic anchor to trigger the actual download dialog.
const triggerDownload = async (url, filename) => {
    try {
        // cache: 'no-store' forces a fresh 200 OK with body instead of a 304
        // (Not Modified) — fetch() returns an empty body on 304, which turns
        // into an empty blob and a 0-byte download. credentials:'omit' also
        // avoids any cookie-shaped 401 from admin-service's auth middleware
        // since the /uploads route is unauthenticated static content.
        const res = await fetch(url, { cache: 'no-store', credentials: 'omit' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        if (!blob.size) throw new Error('Empty response body');
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename || 'download';
        document.body.appendChild(a);
        a.click();
        a.remove();
        // Free the blob after the click has registered. 1s is well past any
        // browser's "starting download…" handoff but short enough not to
        // leak memory if the user grinds through many lessons.
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch (e) {
        // Network/permission failure — fall back to a plain navigation so
        // the user at least sees the file (or the 404, if that's what's
        // wrong) instead of a silent dead click.
        console.warn('[download] blob path failed, falling back to direct nav:', e);
        window.open(url, '_blank', 'noopener');
    }
};

// Build a playable URL for a stored upload. Absolute URLs (http://, https://,
// blob:, data:) pass through unchanged so YouTube/Vimeo/Drive embeds keep
// working; everything else gets joined onto ADMIN_BASE.
const resolveUploadUrl = (src) => {
    const s = String(src || '').trim();
    if (!s) return s;
    if (/^(https?:|blob:|data:)/i.test(s)) return s;
    return `${ADMIN_BASE.replace(/\/$/, '')}/${s.replace(/^\/+/, '')}`;
};

// Same as resolveUploadUrl, but for the `lesson.attachment` column on image
// and document_type lessons. CurriculumService.buildLessonData saves only
// the generated FILENAME there (not the full relative path), so we have to
// prepend uploads/lesson_file/attachment/ before joining onto ADMIN_BASE.
// Pass-through for absolute URLs and for values that already include a slash
// (legacy rows that stored the full path).
const ATTACHMENT_DIR = 'uploads/lesson_file/attachment';
const resolveAttachmentUrl = (src) => {
    const s = String(src || '').trim();
    if (!s) return s;
    if (/^(https?:|blob:|data:)/i.test(s)) return s;
    const relative = s.includes('/') ? s : `${ATTACHMENT_DIR}/${s}`;
    return `${ADMIN_BASE.replace(/\/$/, '')}/${relative.replace(/^\/+/, '')}`;
};

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

// Self-contained image carousel for multi-image lessons. Kept dependency-free
// and styled to match the dark player chrome (the rest of this file builds its
// own controls rather than pulling in the shadcn/embla Carousel, which is
// themed for light surfaces). Shows one image at a time with prev/next arrows,
// a counter, and dot indicators; wraps around at both ends.
function ImageCarousel({ urls, title }) {
    const [index, setIndex] = useState(0);
    const count = urls.length;
    const go = (delta) => setIndex((i) => (i + delta + count) % count);

    return (
        <div className="relative bg-black select-none">
            <div className="flex items-center justify-center w-full max-h-[80vh] aspect-video overflow-hidden">
                <img
                    src={urls[index]}
                    alt={`${title} ${index + 1} of ${count}`}
                    className="max-w-full max-h-[80vh] object-contain"
                    draggable={false}
                />
            </div>

            {/* Prev / Next */}
            <button
                type="button"
                onClick={() => go(-1)}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-black/55 text-white hover:bg-black/80 transition-colors"
                aria-label="Previous image"
            >
                <i className="fa fa-chevron-left" />
            </button>
            <button
                type="button"
                onClick={() => go(1)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-black/55 text-white hover:bg-black/80 transition-colors"
                aria-label="Next image"
            >
                <i className="fa fa-chevron-right" />
            </button>

            {/* Counter */}
            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-black/55 text-white text-[12px] font-medium">
                {index + 1} / {count}
            </div>

            {/* Dot indicators */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2">
                {urls.map((_, i) => (
                    <button
                        key={i}
                        type="button"
                        onClick={() => setIndex(i)}
                        className={`h-2.5 rounded-full transition-all ${i === index ? 'w-6 bg-white' : 'w-2.5 bg-white/50 hover:bg-white/75'}`}
                        aria-label={`Go to image ${i + 1}`}
                        aria-current={i === index}
                    />
                ))}
            </div>
        </div>
    );
}

// Inline PDF viewer used for both native PDF lessons and the generated PDF
// rendition of Office documents. Renders via <object> using the browser's
// built-in PDF viewer; #toolbar=0&navpanes=0&scrollbar=1 hides the floating
// toolbar and thumbnail pane (Chromium/Firefox honour it). A floating Download
// button replaces the hidden toolbar's download action.
function PdfViewer({ src, downloadName, title }) {
    const pdfSrc = `${src}#toolbar=0&navpanes=0&scrollbar=1`;
    return (
        <div className="relative w-full h-[80vh] bg-white">
            <object data={pdfSrc} type="application/pdf" className="w-full h-full">
                <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                    <i className="fa fa-file-pdf text-[48px] text-[#177385] mb-4" />
                    <p className="text-gray-700 font-semibold mb-1">{title}</p>
                    <p className="text-gray-500 text-sm mb-5">
                        Inline preview isn't available in this browser.
                    </p>
                    <button
                        type="button"
                        onClick={() => triggerDownload(src, downloadName)}
                        className="ol-btn-primary"
                    >
                        <i className="fa fa-download mr-2" />
                        Download
                    </button>
                </div>
            </object>
            <button
                type="button"
                onClick={() => triggerDownload(src, downloadName)}
                className="absolute top-3 right-3 z-10 inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-black/70 text-white text-[13px] font-medium hover:bg-black/85 shadow-md"
                title="Download"
            >
                <i className="fa fa-download" />
                Download
            </button>
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
        // system-video is a file uploaded via the admin and stored as a
        // RELATIVE upload path; html5 is a direct .mp4 URL the admin typed
        // (already absolute). resolveUploadUrl handles both.
        const videoUrl = resolveUploadUrl(lesson.lesson_src);
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
                <source src={videoUrl} type="video/mp4" />
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
        // CurriculumService stores image lessons in one of two shapes on
        // lesson.attachment:
        //   - JSON array of filenames (new multi-image format)
        //   - single filename string (legacy pre-multi rows)
        // Normalise both to string[] and render a grid for >1, a single
        // hero image for exactly 1. resolveAttachmentUrl prepends the
        // uploads/lesson_file/attachment/ directory so each <img> resolves.
        const raw = String(lesson.attachment || lesson.lesson_src || '').trim();
        const names = (() => {
            if (!raw) return [];
            if (raw.startsWith('[')) {
                try {
                    const arr = JSON.parse(raw);
                    return Array.isArray(arr) ? arr.filter(Boolean).map(String) : [];
                } catch { return [raw]; }
            }
            return [raw];
        })();
        if (names.length === 0) {
            return <div className="bg-black/40 p-6 text-white/70 text-center">No image attached</div>;
        }
        if (names.length === 1) {
            return (
                <img
                    src={resolveAttachmentUrl(names[0])}
                    alt={lesson.title}
                    className="w-full max-h-[80vh] object-contain bg-black"
                />
            );
        }
        return (
            <ImageCarousel
                urls={names.map(resolveAttachmentUrl)}
                title={lesson.title}
                key={lesson.id}
            />
        );
    }

    if (t === 'document_type') {
        // Document lessons are restricted to PDF and plain text (the admin
        // form only offers those). lesson_src is empty for uploaded documents —
        // the file name is stored in lesson.attachment.
        const src = resolveAttachmentUrl(lesson.attachment || lesson.lesson_src);
        // attachment_type is the extension (e.g. "pdf", "txt"). Trust the
        // filename's actual extension as a fallback when attachment_type wasn't
        // set (older rows / direct DB inserts).
        const declaredExt = String(lesson.attachment_type || '').toLowerCase();
        const filenameExt = String(lesson.attachment || lesson.lesson_src || '')
            .split('.').pop().toLowerCase();
        const ext = declaredExt || filenameExt;
        if (ext === 'txt') {
            // Plain text renders inline in a same-origin <iframe>; the browser
            // displays it as text. Download stays available via the toolbar.
            const downloadName = lesson.title ? `${lesson.title}.txt` : (lesson.attachment || 'document.txt');
            return (
                <div className="relative w-full h-[80vh] bg-white">
                    <iframe src={src} className="w-full h-full" title={lesson.title} />
                    <button
                        type="button"
                        onClick={() => triggerDownload(src, downloadName)}
                        className="absolute top-3 right-3 z-10 inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-black/70 text-white text-[13px] font-medium hover:bg-black/85 shadow-md"
                        title="Download"
                    >
                        <i className="fa fa-download" />
                        Download
                    </button>
                </div>
            );
        }
        // Default: PDF (the only other allowed document type).
        const downloadName = lesson.title ? `${lesson.title}.pdf` : (lesson.attachment || 'document.pdf');
        return <PdfViewer src={src} downloadName={downloadName} title={lesson.title} />;
    }

    if (t === 'quiz') {
        // Reuse onLessonEnded so a submitted quiz ticks in the sidebar via
        // the same completeLesson path the video player uses. The `key` is
        // essential: without it, navigating between two quiz lessons keeps
        // the same component instance and leaks answers/submitted state
        // from the previous quiz, which made a stray Submit click record
        // the previous quiz's submission shape against the new quiz id.
        // Keying by lesson.id forces a clean unmount/remount per quiz.
        return <QuizPlayer key={lesson.id} lesson={lesson} onCompleted={onLessonEnded} />;
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
