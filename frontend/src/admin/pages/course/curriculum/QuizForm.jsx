import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { storeQuiz, updateQuiz, getQuiz } from '../../../api/quiz';

const splitDuration = (str) => {
    const p = String(str || '0:0:0').split(':');
    return { hour: Number(p[0] || 0), minute: Number(p[1] || 0), second: Number(p[2] || 0) };
};

export default function QuizForm({ course, sections, quizId, onDone }) {
    const [title, setTitle] = useState('');
    const [sectionId, setSectionId] = useState(sections[0]?.id || '');
    const [totalMark, setTotalMark] = useState(10);
    const [passMark, setPassMark] = useState(5);
    const [retake, setRetake] = useState(1);
    const [hour, setHour] = useState(0);
    const [minute, setMinute] = useState(10);
    const [second, setSecond] = useState(0);
    const [description, setDescription] = useState('');
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(!!quizId);

    useEffect(() => {
        if (!quizId) return;
        (async () => {
            try {
                const r = await getQuiz(quizId);
                const q = r.quiz;
                setTitle(q.title || '');
                setSectionId(q.section_id || '');
                setTotalMark(q.total_mark || 10);
                setPassMark(q.pass_mark || 5);
                setRetake(q.retake || 1);
                setDescription(q.description || '');
                const d = splitDuration(q.duration);
                setHour(d.hour); setMinute(d.minute); setSecond(d.second);
            } catch (e) {
                toast.error(e.response?.data?.error || 'Failed to load quiz');
            } finally {
                setLoading(false);
            }
        })();
    }, [quizId]);

    const submit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const body = {
                course_id: course.id,
                title,
                section: sectionId,
                total_mark: totalMark,
                pass_mark: passMark,
                retake,
                hour, minute, second,
                description,
            };
            if (quizId) await updateQuiz(quizId, body);
            else await storeQuiz(body);
            onDone();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="text-[14px] text-gray">Loading…</div>;

    return (
        <form onSubmit={submit}>
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
            <div className="grid grid-cols-3 gap-3 mb-3">
                <div>
                    <label className="ol-form-label">Total mark</label>
                    <input type="number" min="1" className="ol-form-control" value={totalMark} onChange={(e) => setTotalMark(e.target.value)} required />
                </div>
                <div>
                    <label className="ol-form-label">Pass mark</label>
                    <input type="number" min="1" className="ol-form-control" value={passMark} onChange={(e) => setPassMark(e.target.value)} required />
                </div>
                <div>
                    <label className="ol-form-label">Retake</label>
                    <input type="number" min="1" className="ol-form-control" value={retake} onChange={(e) => setRetake(e.target.value)} required />
                </div>
            </div>
            <label className="ol-form-label">Duration</label>
            <div className="grid grid-cols-3 gap-3 mb-3">
                <input type="number" min="0" max="23" className="ol-form-control" value={hour} onChange={(e) => setHour(e.target.value)} placeholder="HH" />
                <input type="number" min="0" max="59" className="ol-form-control" value={minute} onChange={(e) => setMinute(e.target.value)} placeholder="MM" />
                <input type="number" min="0" max="59" className="ol-form-control" value={second} onChange={(e) => setSecond(e.target.value)} placeholder="SS" />
            </div>
            <div className="mb-3">
                <label className="ol-form-label">Description</label>
                <textarea className="ol-form-control" rows="3" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="text-center">
                <button className="ol-btn-primary w-full" disabled={saving}>{saving ? 'Saving…' : (quizId ? 'Update quiz' : 'Add quiz')}</button>
            </div>
        </form>
    );
}
