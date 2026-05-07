import { useState } from 'react';
import { toast } from 'react-toastify';
import { storeLesson } from '../../../api/curriculum';
import { detectVideoDuration, detectFileDuration } from './videoDuration';

// Maps picker value -> backend lesson_type / lesson_provider / label
const TYPE_MAP = {
    youtube:            { lesson_type: 'video-url',     lesson_provider: 'youtube',            label: 'Youtube Video' },
    vimeo:              { lesson_type: 'vimeo-url',     lesson_provider: 'vimeo',              label: 'Vimeo Video' },
    html5:              { lesson_type: 'html5',         lesson_provider: 'html5',              label: 'Video url [.mp4]' },
    google_drive_video: { lesson_type: 'google_drive',  lesson_provider: 'google_drive_video', label: 'Google drive video' },
    text:               { lesson_type: 'text',          lesson_provider: 'text',               label: 'Text' },
    iframe:             { lesson_type: 'iframe',        lesson_provider: 'iframe',             label: 'Iframe embed' },
    video:              { lesson_type: 'system-video',  lesson_provider: 'system-video',       label: 'Video file' },
    document:           { lesson_type: 'document_type', lesson_provider: 'document',           label: 'Document file' },
    image:              { lesson_type: 'image',         lesson_provider: 'image',              label: 'Image' },
    scorm:              { lesson_type: 'scorm',         lesson_provider: 'scorm',              label: 'Scorm Content' },
};

const isUrlType = (t) => ['youtube', 'vimeo', 'html5', 'google_drive_video'].includes(t);
const isFileType = (t) => ['video', 'document', 'image', 'scorm'].includes(t);

const DOC_PROVIDERS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'];
const SCORM_PROVIDERS = ['scorm 1.2', 'scorm 2004'];

export default function LessonAddForm({ course, sections, lessonType, onDone }) {
    const map = TYPE_MAP[lessonType];
    const [title, setTitle] = useState('');
    const [sectionId, setSectionId] = useState(sections[0]?.id || '');
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
    const [detectingDuration, setDetectingDuration] = useState(false);

    // Best-effort duration detection. If we can determine it, prefill the field;
    // otherwise leave whatever the user typed alone.
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

    const submit = async (e) => {
        e.preventDefault();
        if (!map) return;
        setSaving(true);
        try {
            const fd = new FormData();
            fd.append('course_id', course.id);
            fd.append('section_id', sectionId);
            fd.append('title', title);
            fd.append('summary', summary || '');
            fd.append('free_lesson', free ? 1 : 0);
            fd.append('lesson_type', map.lesson_type);
            fd.append('lesson_provider', map.lesson_provider);

            if (isUrlType(lessonType)) {
                fd.append('lesson_src', lessonSrc);
                fd.append('duration', duration || '00:00:00');
            } else if (lessonType === 'iframe') {
                fd.append('iframe_source', iframeSource);
            } else if (lessonType === 'text') {
                fd.append('text_description', textDescription);
            } else if (lessonType === 'video') {
                if (!systemVideoFile) { toast.error('Please choose a video file'); setSaving(false); return; }
                fd.append('system_video_file', systemVideoFile);
                fd.append('duration', duration || '00:00:00');
            } else if (lessonType === 'document') {
                if (!attachment) { toast.error('Please choose a document'); setSaving(false); return; }
                fd.append('attachment', attachment);
                fd.append('attachment_type', attachmentType);
            } else if (lessonType === 'image') {
                if (!attachment) { toast.error('Please choose an image'); setSaving(false); return; }
                fd.append('attachment', attachment);
            } else if (lessonType === 'scorm') {
                if (!scormFile) { toast.error('Please choose a SCORM zip'); setSaving(false); return; }
                fd.append('scorm_file', scormFile);
                fd.append('scorm_provider', scormProvider);
            }

            await storeLesson(fd);
            onDone();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed');
        } finally {
            setSaving(false);
        }
    };

    if (!map) return <div className="text-[14px] text-gray">Unknown lesson type.</div>;

    return (
        <form onSubmit={submit}>
            <div className="bg-lightgreen/60 border border-softgreen/70 rounded-ol-8 p-3 mb-3 flex items-center justify-between">
                <p className="text-[14px] text-dark m-0"><span className="text-gray">Lesson type:</span> <strong>{map.label}</strong></p>
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

            {isUrlType(lessonType) && (
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

            {lessonType === 'iframe' && (
                <div className="mb-3">
                    <label className="ol-form-label">Iframe source</label>
                    <textarea className="ol-form-control" rows="3" value={iframeSource} onChange={(e) => setIframeSource(e.target.value)} required />
                </div>
            )}

            {lessonType === 'text' && (
                <div className="mb-3">
                    <label className="ol-form-label">Text description</label>
                    <textarea className="ol-form-control" rows="6" value={textDescription} onChange={(e) => setTextDescription(e.target.value)} placeholder="HTML allowed" />
                </div>
            )}

            {lessonType === 'video' && (
                <>
                    <div className="mb-3">
                        <label className="ol-form-label">Video file</label>
                        <input
                            type="file"
                            className="ol-form-control"
                            accept="video/*"
                            onChange={(e) => handleSystemVideoChange(e.target.files?.[0] || null)}
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

            {lessonType === 'document' && (
                <>
                    <div className="mb-3">
                        <label className="ol-form-label">Document file</label>
                        <input type="file" className="ol-form-control" onChange={(e) => setAttachment(e.target.files?.[0] || null)} required />
                    </div>
                    <div className="mb-3">
                        <label className="ol-form-label">Document type</label>
                        <select className="ol-form-control" value={attachmentType} onChange={(e) => setAttachmentType(e.target.value)}>
                            {DOC_PROVIDERS.map((p) => <option key={p} value={p}>{p.toUpperCase()}</option>)}
                        </select>
                    </div>
                </>
            )}

            {lessonType === 'image' && (
                <div className="mb-3">
                    <label className="ol-form-label">Image file</label>
                    <input type="file" className="ol-form-control" accept="image/*" onChange={(e) => setAttachment(e.target.files?.[0] || null)} required />
                </div>
            )}

            {lessonType === 'scorm' && (
                <>
                    <div className="mb-3">
                        <label className="ol-form-label">SCORM zip file</label>
                        <input type="file" className="ol-form-control" accept=".zip" onChange={(e) => setScormFile(e.target.files?.[0] || null)} required />
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
                <input id="free_lesson" type="checkbox" checked={free} onChange={(e) => setFree(e.target.checked)} />
                <label htmlFor="free_lesson" className="text-[14px] text-dark">Mark as free lesson</label>
            </div>

            <div className="text-center">
                <button className="ol-btn-primary w-full" disabled={saving}>{saving ? 'Saving…' : 'Add lesson'}</button>
            </div>
        </form>
    );
}
