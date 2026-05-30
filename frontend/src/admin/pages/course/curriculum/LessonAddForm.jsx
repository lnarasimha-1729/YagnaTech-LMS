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

// Document lessons are restricted to formats the player can preview inline.
const DOC_PROVIDERS = ['pdf', 'txt'];
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
    // Image lessons accept 1..N files. Held in a separate state so the doc
    // upload (single File) and image upload (File[]) don't collide.
    const [imageFiles, setImageFiles] = useState([]);
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
                if (!imageFiles.length) { toast.error('Please choose at least one image'); setSaving(false); return; }
                // Multer's upload.fields() expects every file under the same
                // field name to come through as separate `attachment` parts —
                // appending the same key N times is the standard pattern.
                imageFiles.forEach((f) => fd.append('attachment', f));
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
                        <input type="file" className="ol-form-control" accept=".pdf,.txt,application/pdf,text/plain" onChange={(e) => setAttachment(e.target.files?.[0] || null)} required />
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
                    <label className="ol-form-label">
                        Image files
                        <span className="ml-2 text-[12px] text-gray font-normal">
                            ({imageFiles.length} selected)
                        </span>
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
                        required={imageFiles.length === 0}
                    />
                    {imageFiles.length > 0 && (
                        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 mt-3">
                            {imageFiles.map((f, i) => (
                                <div key={`${f.name}-${i}`} className="relative group">
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
                        </div>
                    )}
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
