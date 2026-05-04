import { useState } from 'react';

export default function SectionForm({ section, onSubmit, submitLabel }) {
    const [title, setTitle] = useState(section?.title || '');
    const submit = (e) => { e.preventDefault(); onSubmit({ title }); };
    return (
        <form onSubmit={submit}>
            <div className="mb-3">
                <label className="ol-form-label">Title</label>
                <input className="ol-form-control" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter title" required autoFocus />
            </div>
            <div className="mb-2">
                <button className="ol-btn-primary">{submitLabel}</button>
            </div>
        </form>
    );
}
