import { useState } from 'react';

const parse = (v) => { try { return v ? JSON.parse(v) : {}; } catch { return {}; } };

export default function DripTab({ course, onSave, formId }) {
    const drip = parse(course.drip_content_settings);
    const [f, setF] = useState({
        enable_drip_content: course.enable_drip_content ? '1' : '0',
        lesson_completion_role: drip.lesson_completion_role || 'percentage',
        // minimum_duration is stored in seconds — show it as a plain number.
        minimum_duration: drip.minimum_duration != null ? String(drip.minimum_duration) : '10',
        minimum_percentage: drip.minimum_percentage || '30',
        locked_lesson_message: drip.locked_lesson_message || '',
    });
    const set = (k, v) => setF((s) => ({ ...s, [k]: v }));

    const dripOn = f.enable_drip_content === '1';
    const isDuration = f.lesson_completion_role === 'duration';

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

            {/* The completion rule decides when a lesson auto-completes. It
                applies whether or not drip is on — with drip Off it only marks
                progress; with drip On it also gates the next lesson. So these
                fields stay visible in both modes. */}
            <div className="mb-3">
                <label className="ol-form-label">Lesson completion rule</label>
                <select className="ol-form-control" value={f.lesson_completion_role} onChange={(e) => set('lesson_completion_role', e.target.value)}>
                    <option value="percentage">Percentage watched</option>
                    <option value="duration">Minimum duration</option>
                </select>
            </div>

            {/* Show only the field that matches the selected rule. */}
            {isDuration ? (
                <div className="mb-3">
                    <label className="ol-form-label">Minimum duration (seconds)</label>
                    <input
                        className="ol-form-control"
                        type="number"
                        min="1"
                        step="1"
                        value={f.minimum_duration}
                        onChange={(e) => set('minimum_duration', e.target.value)}
                        placeholder="e.g. 10"
                    />
                    <p className="text-[12px] text-gray mt-1">
                        {dripOn
                            ? 'A lesson unlocks the next one once the student has watched this many seconds.'
                            : 'A lesson is marked complete once the student has watched this many seconds.'}
                    </p>
                </div>
            ) : (
                <div className="mb-3">
                    <label className="ol-form-label">Minimum percentage</label>
                    <input
                        className="ol-form-control"
                        type="number"
                        min="1"
                        max="100"
                        step="1"
                        value={f.minimum_percentage}
                        onChange={(e) => set('minimum_percentage', e.target.value)}
                        placeholder="e.g. 30"
                    />
                    <p className="text-[12px] text-gray mt-1">
                        {dripOn
                            ? 'A lesson unlocks the next one once the student has watched this percentage of it.'
                            : 'A lesson is marked complete once the student has watched this percentage of it.'}
                    </p>
                </div>
            )}

            {/* The locked-lesson message only matters when drip gating is on. */}
            {dripOn && (
                <div className="mb-4">
                    <label className="ol-form-label">Locked lesson message</label>
                    <textarea className="ol-form-control" rows="4" value={f.locked_lesson_message} onChange={(e) => set('locked_lesson_message', e.target.value)} placeholder="HTML allowed" />
                </div>
            )}
        </form>
    );
}
