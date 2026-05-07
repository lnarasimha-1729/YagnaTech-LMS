import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { getLesson, updateLesson } from '../../../api/curriculum';
import { detectVideoDuration, detectFileDuration } from './videoDuration';

const URL_TYPES = ['video-url', 'vimeo-url', 'html5', 'google_drive'];
const DOC_PROVIDERS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'];
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
                if (attachment) fd.append('attachment', attachment);
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
                        <input type="file" className="ol-form-control" onChange={(e) => setAttachment(e.target.files?.[0] || null)} />
                    </div>
                    <div className="mb-3">
                        <label className="ol-form-label">Document type</label>
                        <select className="ol-form-control" value={attachmentType} onChange={(e) => setAttachmentType(e.target.value)}>
                            {DOC_PROVIDERS.map((p) => <option key={p} value={p}>{p.toUpperCase()}</option>)}
                        </select>
                    </div>
                </>
            )}

            {t === 'image' && (
                <>
                    {lesson.attachment && <p className="text-[13px] text-gray mb-2">Current: {lesson.attachment}</p>}
                    <div className="mb-3">
                        <label className="ol-form-label">Replace image (optional)</label>
                        <input type="file" className="ol-form-control" accept="image/*" onChange={(e) => setAttachment(e.target.files?.[0] || null)} />
                    </div>
                </>
            )}

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
