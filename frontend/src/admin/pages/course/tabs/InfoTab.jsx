import { useState } from 'react';

const parseJson = (v, fallback) => {
    try { return v ? JSON.parse(v) : fallback; } catch { return fallback; }
};

export default function InfoTab({ course, onSave, formId }) {
    const [requirements, setRequirements] = useState(parseJson(course.requirements, ['']));
    const [outcomes, setOutcomes] = useState(parseJson(course.outcomes, ['']));
    const [faqs, setFaqs] = useState(parseJson(course.faqs, [{ title: '', description: '' }]));

    const setArr = (setter, arr, i, v) => { const next = [...arr]; next[i] = v; setter(next); };
    const addRow = (setter, arr) => setter([...arr, '']);

    const submit = (e) => {
        e.preventDefault();
        const fd = new FormData();
        requirements.forEach((v) => fd.append('requirements[]', v));
        outcomes.forEach((v) => fd.append('outcomes[]', v));
        faqs.forEach((f) => { fd.append('faq_title[]', f.title || ''); fd.append('faq_description[]', f.description || ''); });
        onSave(fd);
    };

    return (
        <form id={formId} onSubmit={submit}>
            <h6 className="text-[14px] font-semibold text-dark mb-3">Outcomes</h6>
            {outcomes.map((v, i) => (
                <input key={i} className="ol-form-control mb-2" value={v} onChange={(e) => setArr(setOutcomes, outcomes, i, e.target.value)} />
            ))}
            <button type="button" className="ol-btn-light ol-btn-sm mb-4" onClick={() => addRow(setOutcomes, outcomes)}>+ Add</button>

            <h6 className="text-[14px] font-semibold text-dark mb-3">Requirements</h6>
            {requirements.map((v, i) => (
                <input key={i} className="ol-form-control mb-2" value={v} onChange={(e) => setArr(setRequirements, requirements, i, e.target.value)} />
            ))}
            <button type="button" className="ol-btn-light ol-btn-sm mb-4" onClick={() => addRow(setRequirements, requirements)}>+ Add</button>

            <h6 className="text-[14px] font-semibold text-dark mb-3">FAQs</h6>
            {faqs.map((f, i) => (
                <div className="grid grid-cols-12 gap-2 mb-2" key={i}>
                    <div className="col-span-12 md:col-span-4">
                        <input className="ol-form-control" placeholder="Title" value={f.title || ''}
                            onChange={(e) => { const n = [...faqs]; n[i] = { ...n[i], title: e.target.value }; setFaqs(n); }} />
                    </div>
                    <div className="col-span-12 md:col-span-8">
                        <input className="ol-form-control" placeholder="Description" value={f.description || ''}
                            onChange={(e) => { const n = [...faqs]; n[i] = { ...n[i], description: e.target.value }; setFaqs(n); }} />
                    </div>
                </div>
            ))}
            <button type="button" className="ol-btn-light ol-btn-sm mb-4" onClick={() => setFaqs([...faqs, { title: '', description: '' }])}>+ Add FAQ</button>

        </form>
    );
}
