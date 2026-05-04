import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { storeLiveClass, updateLiveClass, listInstructors } from '../../../api/liveclass';

const formatLocal = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function LiveClassForm({ course, liveClass, onDone }) {
    const editing = !!liveClass;
    const [topic, setTopic] = useState(liveClass?.class_topic || '');
    const [provider, setProvider] = useState(liveClass?.provider || 'jitsi');
    const [userId, setUserId] = useState(liveClass?.user_id || '');
    const [dateTime, setDateTime] = useState(formatLocal(liveClass?.class_date_and_time));
    const [note, setNote] = useState(liveClass?.note || '');
    const [instructors, setInstructors] = useState([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        listInstructors().then((r) => {
            setInstructors(r.instructors);
            if (!editing && !userId && r.instructors.length) setUserId(r.instructors[0].id);
        });
    }, []);

    const submit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const body = { class_topic: topic, provider, user_id: userId, class_date_and_time: dateTime, note };
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
                <label className="ol-form-label">Class topic</label>
                <input className="ol-form-control" value={topic} onChange={(e) => setTopic(e.target.value)} maxLength={255} required autoFocus />
            </div>
            <div className="mb-3">
                <label className="ol-form-label">Instructor</label>
                <select className="ol-form-control" value={userId} onChange={(e) => setUserId(e.target.value)} required>
                    {instructors.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
                </select>
            </div>
            <div className="mb-3">
                <label className="ol-form-label">Provider</label>
                <select className="ol-form-control" value={provider} onChange={(e) => setProvider(e.target.value)} disabled={editing}>
                    <option value="jitsi">Jitsi</option>
                    <option value="zoom">Zoom</option>
                </select>
            </div>
            <div className="mb-3">
                <label className="ol-form-label">Date and time</label>
                <input type="datetime-local" className="ol-form-control" value={dateTime} onChange={(e) => setDateTime(e.target.value)} required />
            </div>
            <div className="mb-3">
                <label className="ol-form-label">Note</label>
                <textarea className="ol-form-control" rows="3" value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
            <div className="text-center">
                <button className="ol-btn-primary w-full" disabled={saving}>{saving ? 'Saving…' : (editing ? 'Update live class' : 'Add live class')}</button>
            </div>
        </form>
    );
}
