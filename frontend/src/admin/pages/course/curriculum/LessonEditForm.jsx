import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { getLesson, updateLesson } from '../../../api/curriculum';
import { detectVideoDuration, detectFileDuration } from './videoDuration';

const URL_TYPES = ['video-url', 'vimeo-url', 'html5', 'google_drive'];
// Document lessons are restricted to formats the player can preview inline.
const DOC_PROVIDERS = ['pdf', 'txt'];
const SCORM_PROVIDERS = ['scorm 1.2', 'scorm 2004'];

const labelFor = (lesson_type, lesson_provider) => {
    if (lesson_type === 'video-url' && lesson_provider === 'youtube') return 'Youtube Video';
    if (lesson_type === 'vimeo-url') return 'Vimeo Video';
    if (lesson_type === 'html5') return 'Video url [.mp4]';
    if (lesson_type === 'google_drive') return 'Google drive video';
    if (lesson_type === 'iframe') return 'Iframe embed';
    if (lesson_type === 'text') return 'Text';
    if (lesson_type === 'system-video') return 'Video file';
    if (lesson_type === 'document_type') return 'Document file';
    if (lesson_type === 'image') return 'Image';
    if (lesson_type === 'scorm') return 'Scorm Content';
    return lesson_type;
};

export default function LessonEditForm({ lessonId, sections, onDone }) {
    const [lesson, setLesson] = useState(null);
    const [title, setTitle] = useState('');
    const [sectionId, setSectionId] = useState('');
    const [summary, setSummary] = useState('');
    const [free, setFree] = useState(false);
    const [lessonSrc, setLessonSrc] = useState('');
    const [iframeSource, setIframeSource] = useState('');
    const [textDescription, setTextDescription] = useState('');
    const [duration, setDuration] = useState('00:00:00');
    const [attachment, setAttachment] = useState(null);
    // Multi-image lessons keep their pending uploads here. Submitting any
    // file(s) REPLACES the saved set on the server, so we also need a small
    // helper that parses the existing attachment column to show what's
    // currently saved (legacy single-string OR new JSON-array shape).
    const [imageFiles, setImageFiles] = useState([]);
    const [attachmentType, setAttachmentType] = useState(DOC_PROVIDERS[0]);
    const [scormFile, setScormFile] = useState(null);
    const [scormProvider, setScormProvider] = useState(SCORM_PROVIDERS[0]);
    const [systemVideoFile, setSystemVideoFile] = useState(null);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [detectingDuration, setDetectingDuration] = useState(false);

    const handleUrlChange = (value) => {
        setLessonSrc(value);
        const trimmed = value.trim();
        if (!trimmed) return;
        setDetectingDuration(true);
        detectVideoDuration(trimmed)
            .then((d) => { if (d) setDuration(d); })
            .finally(() => setDetectingDuration(false));
    };

    const handleSystemVideoChange = (file) => {
        setSystemVideoFile(file);
        if (!file) return;
        setDetectingDuration(true);
        detectFileDuration(file)
            .then((d) => { if (d) setDuration(d); })
            .finally(() => setDetectingDuration(false));
    };

    // A native file input only reports the files chosen in the most recent
    // dialog, so APPEND to the existing selection rather than replacing it.
    // De-dupe by name+size so re-picking the same file doesn't add a clone.
    const addImageFiles = (picked) => {
        setImageFiles((prev) => {
            const seen = new Set(prev.map((f) => `${f.name}-${f.size}`));
            const next = [...prev];
            for (const f of picked) {
                const key = `${f.name}-${f.size}`;
                if (!seen.has(key)) { seen.add(key); next.push(f); }
            }
            return next;
        });
    };

    useEffect(() => {
        (async () => {
            try {
                const r = await getLesson(lessonId);
                const l = r.lesson;
                setLesson(l);
                setTitle(l.title || '');
                setSectionId(l.section_id || '');
                setSummary(l.summary || '');
                setFree(!!l.is_free);
                setLessonSrc(l.lesson_src || '');
                setDuration(l.duration || '00:00:00');
                if (l.lesson_type === 'iframe') setIframeSource(l.lesson_src || '');
                if (l.lesson_type === 'text') setTextDescription(l.attachment || '');
                if (l.lesson_type === 'document_type') setAttachmentType(l.attachment_type || DOC_PROVIDERS[0]);
                if (l.lesson_type === 'scorm') setScormProvider(l.attachment_type || SCORM_PROVIDERS[0]);
            } catch (e) {
                toast.error(e.response?.data?.error || 'Failed to load lesson');
            } finally {
                setLoading(false);
            }
        })();
    }, [lessonId]);

    const submit = async (e) => {
        e.preventDefault();
        if (!lesson) return;
        setSaving(true);
        try {
            const fd = new FormData();
            fd.append('id', lesson.id);
            fd.append('section_id', sectionId);
            fd.append('title', title);
            fd.append('summary', summary || '');
            fd.append('lesson_type', lesson.lesson_type);

            if (URL_TYPES.includes(lesson.lesson_type)) {
                fd.append('lesson_src', lessonSrc);
                fd.append('duration', duration || '00:00:00');
            } else if (lesson.lesson_type === 'iframe') {
                fd.append('iframe_source', iframeSource);
            } else if (lesson.lesson_type === 'text') {
                fd.append('text_description', textDescription);
            } else if (lesson.lesson_type === 'system-video') {
                if (systemVideoFile) fd.append('system_video_file', systemVideoFile);
                fd.append('duration', duration || '00:00:00');
            } else if (lesson.lesson_type === 'document_type') {
                if (attachment) fd.append('attachment', attachment);
                fd.append('attachment_type', attachmentType);
            } else if (lesson.lesson_type === 'image') {
                // Only send if the admin actually picked new images. An empty
                // selection means "keep what's saved" — the backend leaves
                // the column untouched in that case.
                imageFiles.forEach((f) => fd.append('attachment', f));
            } else if (lesson.lesson_type === 'scorm') {
                if (scormFile) fd.append('scorm_file', scormFile);
                fd.append('scorm_provider', scormProvider);
            }

            await updateLesson(fd);
            onDone();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="text-[14px] text-gray">Loading…</div>;
    if (!lesson) return <div className="text-[14px] text-gray">Lesson not found.</div>;

    const t = lesson.lesson_type;

    return (
        <form onSubmit={submit}>
            <div className="bg-lightgreen/60 border border-softgreen/70 rounded-ol-8 p-3 mb-3">
                <p className="text-[14px] text-dark m-0"><span className="text-gray">Lesson type:</span> <strong>{labelFor(t, lesson.lesson_provider)}</strong></p>
            </div>

            <div className="mb-3">
                <label className="ol-form-label">Title</label>
                <input className="ol-form-control" value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus />
            </div>

            <div className="mb-3">
                <label className="ol-form-label">Section</label>
                <select className="ol-form-control" value={sectionId} onChange={(e) => setSectionId(e.target.value)} required>
                    {sections.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
                </select>
            </div>

            {URL_TYPES.includes(t) && (
                <>
                    <div className="mb-3">
                        <label className="ol-form-label">Video url</label>
                        <input
                            className="ol-form-control"
                            value={lessonSrc}
                            onChange={(e) => handleUrlChange(e.target.value)}
                            onPaste={(e) => handleUrlChange(e.clipboardData.getData('text'))}
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <label className="ol-form-label">
                            Duration (HH:MM:SS)
                            {detectingDuration && <span className="ml-2 text-[12px] text-gray">Detecting…</span>}
                        </label>
                        <input className="ol-form-control" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="00:00:00" />
                    </div>
                </>
            )}

            {t === 'iframe' && (
                <div className="mb-3">
                    <label className="ol-form-label">Iframe source</label>
                    <textarea className="ol-form-control" rows="3" value={iframeSource} onChange={(e) => setIframeSource(e.target.value)} required />
                </div>
            )}

            {t === 'text' && (
                <div className="mb-3">
                    <label className="ol-form-label">Text description</label>
                    <textarea className="ol-form-control" rows="6" value={textDescription} onChange={(e) => setTextDescription(e.target.value)} placeholder="HTML allowed" />
                </div>
            )}

            {t === 'system-video' && (
                <>
                    {lesson.lesson_src && <p className="text-[13px] text-gray mb-2">Current: {lesson.lesson_src}</p>}
                    <div className="mb-3">
                        <label className="ol-form-label">Replace video file (optional)</label>
                        <input
                            type="file"
                            className="ol-form-control"
                            accept="video/*"
                            onChange={(e) => handleSystemVideoChange(e.target.files?.[0] || null)}
                        />
                    </div>
                    <div className="mb-3">
                        <label className="ol-form-label">
                            Duration (HH:MM:SS)
                            {detectingDuration && <span className="ml-2 text-[12px] text-gray">Detecting…</span>}
                        </label>
                        <input className="ol-form-control" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="00:00:00" />
                    </div>
                </>
            )}

            {t === 'document_type' && (
                <>
                    {lesson.attachment && <p className="text-[13px] text-gray mb-2">Current: {lesson.attachment}</p>}
                    <div className="mb-3">
                        <label className="ol-form-label">Replace document (optional)</label>
                        <input type="file" className="ol-form-control" accept=".pdf,.txt,application/pdf,text/plain" onChange={(e) => setAttachment(e.target.files?.[0] || null)} />
                    </div>
                    <div className="mb-3">
                        <label className="ol-form-label">Document type</label>
                        <select className="ol-form-control" value={attachmentType} onChange={(e) => setAttachmentType(e.target.value)}>
                            {DOC_PROVIDERS.map((p) => <option key={p} value={p}>{p.toUpperCase()}</option>)}
                        </select>
                    </div>
                </>
            )}

            {t === 'image' && (() => {
                // Saved attachments may be a JSON array (multi) or a plain
                // filename (legacy single). Normalise to string[] for the
                // "Current images" preview row.
                const currentNames = (() => {
                    const s = String(lesson.attachment || '').trim();
                    if (!s) return [];
                    if (s.startsWith('[')) {
                        try {
                            const arr = JSON.parse(s);
                            return Array.isArray(arr) ? arr.map(String) : [];
                        } catch { return []; }
                    }
                    return [s];
                })();
                const ADMIN_BASE = (import.meta.env.VITE_ADMIN_API_URL) || 'http://localhost:4000';
                const urlFor = (name) =>
                    `${ADMIN_BASE.replace(/\/$/, '')}/uploads/lesson_file/attachment/${name}`;
                return (
                    <>
                        {currentNames.length > 0 && (
                            <div className="mb-3">
                                <p className="text-[13px] text-gray mb-2">
                                    Current images ({currentNames.length})
                                </p>
                                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                                    {currentNames.map((n) => (
                                        <img
                                            key={n}
                                            src={urlFor(n)}
                                            alt={n}
                                            className="w-full h-20 object-cover rounded border border-gray-200"
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                        <div className="mb-3">
                            <label className="ol-form-label">
                                Replace with new image(s) (optional)
                                {imageFiles.length > 0 && (
                                    <span className="ml-2 text-[12px] text-gray font-normal">
                                        ({imageFiles.length} selected)
                                    </span>
                                )}
                            </label>
                            <input
                                type="file"
                                className="ol-form-control"
                                accept="image/*"
                                multiple
                                onChange={(e) => {
                                    addImageFiles(Array.from(e.target.files || []));
                                    // Reset so re-selecting the same file still fires onChange.
                                    e.target.value = '';
                                }}
                            />
                            {imageFiles.length > 0 && (
                                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 mt-3">
                                    {imageFiles.map((f, i) => (
                                        <div key={`${f.name}-${i}`} className="relative">
                                            <img
                                                src={URL.createObjectURL(f)}
                                                alt={f.name}
                                                className="w-full h-20 object-cover rounded border border-gray-200"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setImageFiles((s) => s.filter((_, idx) => idx !== i))}
                                                className="absolute top-0 right-0 -mt-1 -mr-1 w-5 h-5 rounded-full bg-black/70 text-white text-[11px] leading-none hover:bg-black"
                                                title="Remove"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                    <p className="col-span-full text-[12px] text-amber-700 mt-1">
                                        Saving will replace all current images.
                                    </p>
                                </div>
                            )}
                        </div>
                    </>
                );
            })()}

            {t === 'scorm' && (
                <>
                    {lesson.attachment && <p className="text-[13px] text-gray mb-2">Current SCORM folder: {lesson.attachment}</p>}
                    <div className="mb-3">
                        <label className="ol-form-label">Replace SCORM zip (optional)</label>
                        <input type="file" className="ol-form-control" accept=".zip" onChange={(e) => setScormFile(e.target.files?.[0] || null)} />
                    </div>
                    <div className="mb-3">
                        <label className="ol-form-label">SCORM version</label>
                        <select className="ol-form-control" value={scormProvider} onChange={(e) => setScormProvider(e.target.value)}>
                            {SCORM_PROVIDERS.map((p) => <option key={p} value={p}>{p.toUpperCase()}</option>)}
                        </select>
                    </div>
                </>
            )}

            <div className="mb-3">
                <label className="ol-form-label">Summary</label>
                <textarea className="ol-form-control" rows="3" value={summary} onChange={(e) => setSummary(e.target.value)} />
            </div>

            <div className="mb-3 flex items-center gap-2">
                <input id="free_lesson_edit" type="checkbox" checked={free} onChange={(e) => setFree(e.target.checked)} />
                <label htmlFor="free_lesson_edit" className="text-[14px] text-dark">Mark as free lesson</label>
            </div>

            <div className="text-center">
                <button className="ol-btn-primary w-full" disabled={saving}>{saving ? 'Saving…' : 'Update lesson'}</button>
            </div>
        </form>
    );
}
