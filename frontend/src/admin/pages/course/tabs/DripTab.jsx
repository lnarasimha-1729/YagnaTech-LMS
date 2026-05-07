import { useState } from 'react';

const secondsToHms = (s) => {
    const n = Number(s) || 0;
    const h = String(Math.floor(n / 3600)).padStart(2, '0');
    const m = String(Math.floor((n % 3600) / 60)).padStart(2, '0');
    const sec = String(n % 60).padStart(2, '0');
    return `${h}:${m}:${sec}`;
};

const parse = (v) => { try { return v ? JSON.parse(v) : {}; } catch { return {}; } };

export default function DripTab({ course, onSave, formId }) {
    const drip = parse(course.drip_content_settings);
    const [f, setF] = useState({
        enable_drip_content: course.enable_drip_content ? '1' : '0',
        lesson_completion_role: drip.lesson_completion_role || 'percentage',
        minimum_duration: secondsToHms(drip.minimum_duration),
        minimum_percentage: drip.minimum_percentage || '30',
        locked_lesson_message: drip.locked_lesson_message || '',
    });
    const set = (k, v) => setF((s) => ({ ...s, [k]: v }));

    const submit = (e) => {
        e.preventDefault();
        const fd = new FormData();
        Object.entries(f).forEach(([k, v]) => fd.append(k, v));
        onSave(fd);
    };

    return (
        <form id={formId} onSubmit={submit}>
            <div className="mb-3">
                <label className="ol-form-label">Enable drip content</label>
                <select className="ol-form-control" value={f.enable_drip_content} onChange={(e) => set('enable_drip_content', e.target.value)}>
                    <option value="0">No</option>
                    <option value="1">Yes</option>
                </select>
            </div>
            <div className="mb-3">
                <label className="ol-form-label">Lesson completion rule</label>
                <select className="ol-form-control" value={f.lesson_completion_role} onChange={(e) => set('lesson_completion_role', e.target.value)}>
                    <option value="percentage">Percentage watched</option>
                    <option value="duration">Minimum duration</option>
                </select>
            </div>
            <div className="mb-3 grid grid-cols-12 gap-3">
                <div className="col-span-6">
                    <label className="ol-form-label">Minimum duration (HH:MM:SS)</label>
                    <input className="ol-form-control" value={f.minimum_duration} onChange={(e) => set('minimum_duration', e.target.value)} />
                </div>
                <div className="col-span-6">
                    <label className="ol-form-label">Minimum percentage</label>
                    <input className="ol-form-control" type="number" value={f.minimum_percentage} onChange={(e) => set('minimum_percentage', e.target.value)} />
                </div>
            </div>
            <div className="mb-4">
                <label className="ol-form-label">Locked lesson message</label>
                <textarea className="ol-form-control" rows="4" value={f.locked_lesson_message} onChange={(e) => set('locked_lesson_message', e.target.value)} placeholder="HTML allowed" />
            </div>
        </form>
    );
}
