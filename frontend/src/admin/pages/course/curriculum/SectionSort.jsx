import { useState } from 'react';
import { toast } from 'react-toastify';
import { sortSections } from '../../../api/curriculum';

export default function SectionSort({ sections, onDone }) {
    const [items, setItems] = useState(sections.map((s) => ({ id: s.id, title: s.title })));
    const [saving, setSaving] = useState(false);

    const move = (idx, dir) => {
        const next = [...items];
        const target = idx + dir;
        if (target < 0 || target >= next.length) return;
        [next[idx], next[target]] = [next[target], next[idx]];
        setItems(next);
    };

    const submit = async () => {
        setSaving(true);
        try {
            await sortSections(items.map((i) => i.id));
            onDone();
        } catch (e) {
            toast.error(e.response?.data?.error || 'Failed');
        } finally {
            setSaving(false);
        }
    };

    if (items.length === 0) return <div className="text-[14px] text-gray">No sections to sort.</div>;

    return (
        <div>
            <ul className="flex flex-col gap-2 mb-4">
                {items.map((s, i) => (
                    <li key={s.id} className="flex items-center justify-between border border-border rounded-ol-8 px-3 py-2">
                        <span className="text-[14px] text-dark">{i + 1}. {s.title}</span>
                        <div className="flex items-center gap-1">
                            <button type="button" disabled={i === 0} onClick={() => move(i, -1)} className="px-2 py-1 text-skin disabled:opacity-30" title="Move up">
                                <span className="fi-rr-angle-small-up" />
                            </button>
                            <button type="button" disabled={i === items.length - 1} onClick={() => move(i, 1)} className="px-2 py-1 text-skin disabled:opacity-30" title="Move down">
                                <span className="fi-rr-angle-small-down" />
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
            <button type="button" className="ol-btn-primary w-full" disabled={saving} onClick={submit}>{saving ? 'Saving…' : 'Save order'}</button>
        </div>
    );
}
