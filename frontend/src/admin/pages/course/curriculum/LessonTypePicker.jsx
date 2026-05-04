import { useState } from 'react';

const TYPES = [
    { value: 'youtube', label: 'YouTube Video' },
    { value: 'vimeo', label: 'Vimeo Video' },
    { value: 'video', label: 'Video file' },
    { value: 'html5', label: 'Video url [ .mp4 ]' },
    { value: 'google_drive_video', label: 'Google drive video' },
    { value: 'document', label: 'Document file' },
    { value: 'text', label: 'Text' },
    { value: 'image', label: 'Image' },
    { value: 'iframe', label: 'Iframe embed' },
    { value: 'scorm', label: 'Scorm Content' },
];

export default function LessonTypePicker({ course, onNext }) {
    const [selected, setSelected] = useState('youtube');

    return (
        <div>
            <div className="bg-lightgreen/60 border border-softgreen/70 rounded-ol-8 p-3 mb-3">
                <p className="text-[14px] text-dark m-0"><span className="text-gray">Course:</span> <strong>{course.title}</strong></p>
            </div>

            <h6 className="text-[16px] font-semibold text-dark mb-3">Select lesson type</h6>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                {TYPES.map((t) => (
                    <label
                        key={t.value}
                        className={`flex items-center justify-between gap-2 border rounded-ol-8 px-3 py-[10px] cursor-pointer transition-colors ${selected === t.value ? 'border-skin bg-lightgreen/40' : 'border-border hover:border-skin'}`}
                    >
                        <span className="text-[14px] text-dark">{t.label}</span>
                        <input
                            type="radio"
                            name="lesson_type"
                            value={t.value}
                            checked={selected === t.value}
                            onChange={(e) => setSelected(e.target.value)}
                            className="accent-skin"
                        />
                    </label>
                ))}
            </div>

            <button type="button" className="ol-btn-primary" onClick={() => onNext(selected)}>
                Next <span className="fi-rr-angle-small-right ms-1" />
            </button>
        </div>
    );
}
