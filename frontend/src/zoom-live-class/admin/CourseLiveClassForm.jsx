import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { storeLiveClass, updateLiveClass } from './liveClassApi';
// Use the same instructor source the admin Manage → Instructors page uses,
// so the dropdown lists every user with role='instructor' from the auth DB.
import { listInstructors } from '@/admin/api/instructor';
import { getStoredUser } from '@/admin/api/auth';

/**
 * Modal body for add/edit of a course live class.
 *
 * Mirrors the existing admin/pages/course/liveclass/LiveClassForm.jsx
 * structurally (same useState + react-toastify pattern), and talks to the
 * /api/admin/zoom-live-class endpoints.
 *
 * Two providers:
 *   - zoom   : meeting is auto-created via the Zoom API
 *   - manual : the instructor pastes any Zoom/Meet/Teams link — no API call;
 *              the student opens that link from the course player
 */

const formatLocal = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function CourseLiveClassForm({ course, liveClass, onDone, onCancel }) {
    const editing = !!liveClass;

    // When an instructor adds a live class, they host it — the Instructor
    // field is auto-filled with themselves and locked. Admins still pick from
    // the full instructor list.
    const currentUser = useMemo(() => getStoredUser(), []);
    const isInstructor = currentUser?.role === 'instructor';
    const selfId = currentUser?.id ?? currentUser?.userId ?? '';

    const [topic, setTopic] = useState(liveClass?.class_topic || '');
    const [userId, setUserId] = useState(
        liveClass?.user_id || liveClass?.host?.id || (isInstructor ? String(selfId) : '')
    );
    const [dateTime, setDateTime] = useState(formatLocal(liveClass?.class_date_and_time));
    const [note, setNote] = useState(liveClass?.note || '');
    const [instructors, setInstructors] = useState([]);
    const [saving, setSaving] = useState(false);

    // Provider — fixed once created, so when editing we keep the existing one.
    const [provider, setProvider] = useState(liveClass?.provider || 'zoom');
    // Manual provider: the pasted meeting URL. Prefill from the existing
    // meeting link when editing a manual class.
    const [meetingLink, setMeetingLink] = useState(
        liveClass?.meeting?.join_url || liveClass?.meeting?.start_url || ''
    );
    const isManual = provider === 'manual';

    useEffect(() => {
        // An instructor can't read the admin-only /manage/instructors endpoint
        // and doesn't need to — they host their own live classes. Seed the
        // dropdown with just themselves.
        if (isInstructor) {
            setInstructors([
                {
                    id: selfId,
                    name: currentUser?.name || currentUser?.email || 'Me',
                    email: currentUser?.email || '',
                },
            ]);
            return;
        }
        // Admin: pull every instructor — same shape Manage → Instructors uses
        // ({ instructors: [{ id, name, email, ... }], total, page, per_page }).
        listInstructors({ per_page: 1000 })
            .then((r) => {
                const list = r.instructors || [];
                setInstructors(list);
                if (!editing && !userId && list.length) setUserId(list[0].id);
            })
            .catch(() => { /* silent — fall back to empty select */ });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editing, isInstructor]);

    const submit = async (e) => {
        e.preventDefault();
        if (saving) return;
        setSaving(true);
        try {
            const body = {
                class_topic: topic,
                provider,
                user_id: userId,
                class_date_and_time: dateTime,
                note,
            };
            // Manual provider — send the pasted link. For a zoom class this
            // key is simply absent and the backend creates the meeting.
            if (isManual) body.meeting_link = meetingLink.trim();
            if (editing) await updateLiveClass(liveClass.id, body);
            else await storeLiveClass(course.id, body);
            onDone();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed');
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={submit}>
            <div className="mb-3">
                <label className="ol-form-label">
                    Class topic <span className="text-danger">*</span>
                </label>
                <input
                    className="ol-form-control"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    maxLength={255}
                    required
                    autoFocus
                />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div>
                    <label className="ol-form-label">
                        Instructor <span className="text-danger">*</span>
                    </label>
                    <select
                        className="ol-form-control"
                        value={userId}
                        onChange={(e) => setUserId(e.target.value)}
                        required
                        disabled={isInstructor}
                    >
                        {!isInstructor && <option value="">Select an option</option>}
                        {instructors.map((u) => (
                            <option key={u.id} value={u.id}>
                                {u.name} {u.email ? `(${u.email})` : ''}
                            </option>
                        ))}
                    </select>
                    {isInstructor && (
                        <p className="text-[12px] text-gray mt-1">
                            You are the host of this live class.
                        </p>
                    )}
                </div>
                <div>
                    <label className="ol-form-label">
                        Class date and time <span className="text-danger">*</span>
                    </label>
                    <input
                        type="datetime-local"
                        className="ol-form-control"
                        value={dateTime}
                        onChange={(e) => setDateTime(e.target.value)}
                        required
                    />
                </div>
            </div>
            <div className="mb-3">
                <label className="ol-form-label">
                    Provider <span className="text-danger">*</span>
                </label>
                <select
                    className="ol-form-control"
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                    /* Provider is fixed once the class exists — changing it
                       would orphan the created Zoom meeting / stored link. */
                    disabled={editing}
                >
                    <option value="zoom">Zoom (auto-create meeting)</option>
                    <option value="manual">Manual link (paste Zoom / Meet / Teams URL)</option>
                </select>
                {!editing && (
                    <p className="text-[12px] text-gray mt-1">
                        {isManual
                            ? 'Paste your own meeting link below — students open it from the course player.'
                            : 'A Zoom meeting is created automatically when you save.'}
                    </p>
                )}
            </div>

            {isManual && (
                <div className="mb-3">
                    <label className="ol-form-label">
                        Meeting link <span className="text-danger">*</span>
                    </label>
                    <input
                        type="url"
                        className="ol-form-control"
                        value={meetingLink}
                        onChange={(e) => setMeetingLink(e.target.value)}
                        placeholder="https://meet.google.com/…  or  https://zoom.us/j/…"
                        required
                    />
                    <p className="text-[12px] text-gray mt-1">
                        Students will join the live class by opening this link.
                    </p>
                </div>
            )}

            <div className="mb-3">
                <label className="ol-form-label">Note for your student</label>
                <textarea
                    className="ol-form-control"
                    rows="3"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                />
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-border">
                {onCancel && (
                    <button
                        type="button"
                        className="ol-btn-outline-secondary"
                        onClick={onCancel}
                        disabled={saving}
                    >
                        Cancel
                    </button>
                )}
                <button type="submit" className="ol-btn-primary" disabled={saving}>
                    {saving ? 'Saving…' : editing ? 'Update live class' : 'Add live class'}
                </button>
            </div>
        </form>
    );
}
