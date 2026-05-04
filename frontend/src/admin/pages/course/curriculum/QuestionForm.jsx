import { useState } from 'react';
import { toast } from 'react-toastify';
import { storeQuestion, updateQuestion } from '../../../api/quiz';

const TYPES = [
    { value: 'mcq', label: 'Multiple choice' },
    { value: 'fill_blanks', label: 'Fill in the blanks' },
    { value: 'true_false', label: 'True / False' },
];

const tryParseArr = (raw, fallback = []) => {
    if (Array.isArray(raw)) return raw;
    if (!raw) return fallback;
    try { const v = JSON.parse(raw); return Array.isArray(v) ? v : fallback; } catch { return fallback; }
};

export default function QuestionForm({ quizId, question, onDone }) {
    const editing = !!question;
    const [type, setType] = useState(question?.type || 'mcq');
    const [title, setTitle] = useState(question?.title || '');

    const initialOptions = editing && question.type === 'mcq' ? tryParseArr(question.options, ['', '']) : ['', ''];
    const [options, setOptions] = useState(initialOptions.length ? initialOptions : ['', '']);

    const initialMcqAnswers = editing && question.type === 'mcq' ? tryParseArr(question.answer, []) : [];
    const [mcqAnswers, setMcqAnswers] = useState(initialMcqAnswers);

    const initialBlanks = editing && question.type === 'fill_blanks' ? tryParseArr(question.answer, ['']) : [''];
    const [blanks, setBlanks] = useState(initialBlanks.length ? initialBlanks : ['']);

    const [tfAnswer, setTfAnswer] = useState(editing && question.type === 'true_false' ? question.answer : 'true');

    const [saving, setSaving] = useState(false);

    const setOpt = (i, v) => { const next = [...options]; next[i] = v; setOptions(next); };
    const addOpt = () => setOptions([...options, '']);
    const removeOpt = (i) => setOptions(options.filter((_, idx) => idx !== i));

    const setBlank = (i, v) => { const next = [...blanks]; next[i] = v; setBlanks(next); };
    const addBlank = () => setBlanks([...blanks, '']);
    const removeBlank = (i) => setBlanks(blanks.filter((_, idx) => idx !== i));

    const toggleMcqAnswer = (val) => {
        setMcqAnswers((prev) => prev.includes(val) ? prev.filter((x) => x !== val) : [...prev, val]);
    };

    const submit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const body = { quiz_id: quizId, title, type };
            if (type === 'mcq') {
                const opts = options.map((o) => String(o).trim()).filter(Boolean);
                if (!opts.length) { toast.error('Add at least one option'); setSaving(false); return; }
                if (!mcqAnswers.length) { toast.error('Select at least one correct answer'); setSaving(false); return; }
                body.options = opts;
                body.answer = mcqAnswers;
            } else if (type === 'fill_blanks') {
                const ans = blanks.map((b) => String(b).trim()).filter(Boolean);
                if (!ans.length) { toast.error('Add at least one answer'); setSaving(false); return; }
                body.answer = ans;
            } else {
                body.answer = tfAnswer;
            }
            if (editing) await updateQuestion(question.id, body);
            else await storeQuestion(body);
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
                <label className="ol-form-label">Type</label>
                <select className="ol-form-control" value={type} onChange={(e) => setType(e.target.value)} disabled={editing}>
                    {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
            </div>
            <div className="mb-3">
                <label className="ol-form-label">Question</label>
                <textarea className="ol-form-control" rows="2" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>

            {type === 'mcq' && (
                <div className="mb-3">
                    <label className="ol-form-label">Options (check the correct ones)</label>
                    {options.map((opt, i) => (
                        <div key={i} className="flex items-center gap-2 mb-2">
                            <input type="checkbox" checked={mcqAnswers.includes(opt)} onChange={() => toggleMcqAnswer(opt)} className="accent-skin" />
                            <input className="ol-form-control flex-1" value={opt} onChange={(e) => setOpt(i, e.target.value)} placeholder={`Option ${i + 1}`} />
                            <button type="button" className="text-danger px-2" onClick={() => removeOpt(i)} disabled={options.length <= 1}>×</button>
                        </div>
                    ))}
                    <button type="button" className="ol-btn-light ol-btn-sm" onClick={addOpt}>+ Add option</button>
                </div>
            )}

            {type === 'fill_blanks' && (
                <div className="mb-3">
                    <label className="ol-form-label">Accepted answers</label>
                    {blanks.map((b, i) => (
                        <div key={i} className="flex items-center gap-2 mb-2">
                            <input className="ol-form-control flex-1" value={b} onChange={(e) => setBlank(i, e.target.value)} placeholder={`Answer ${i + 1}`} />
                            <button type="button" className="text-danger px-2" onClick={() => removeBlank(i)} disabled={blanks.length <= 1}>×</button>
                        </div>
                    ))}
                    <button type="button" className="ol-btn-light ol-btn-sm" onClick={addBlank}>+ Add answer</button>
                </div>
            )}

            {type === 'true_false' && (
                <div className="mb-3 flex gap-4">
                    <label className="flex items-center gap-2">
                        <input type="radio" name="tf" value="true" checked={tfAnswer === 'true'} onChange={(e) => setTfAnswer(e.target.value)} className="accent-skin" />
                        True
                    </label>
                    <label className="flex items-center gap-2">
                        <input type="radio" name="tf" value="false" checked={tfAnswer === 'false'} onChange={(e) => setTfAnswer(e.target.value)} className="accent-skin" />
                        False
                    </label>
                </div>
            )}

            <div className="text-center">
                <button className="ol-btn-primary w-full" disabled={saving}>{saving ? 'Saving…' : (editing ? 'Update question' : 'Add question')}</button>
            </div>
        </form>
    );
}
