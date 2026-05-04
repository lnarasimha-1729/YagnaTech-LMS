import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import Modal from '../../../components/Modal';
import ConfirmDialog from '../../../components/ConfirmDialog';
import { listLiveClasses, deleteLiveClass, startLiveClass } from '../../../api/liveclass';
import LiveClassForm from '../liveclass/LiveClassForm';

const fmt = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return isNaN(d.getTime()) ? iso : d.toLocaleString();
};

export default function LiveClassTab({ course }) {
    const [items, setItems] = useState([]);
    const [modal, setModal] = useState(null);
    const [confirm, setConfirm] = useState(null);

    const load = async () => {
        const r = await listLiveClasses(course.id);
        setItems(r.live_classes);
    };
    useEffect(() => { load(); }, [course.id]);

    const handleDelete = async (id) => {
        try { await deleteLiveClass(id); toast.success('Live class deleted successfully'); setConfirm(null); load(); }
        catch (e) { toast.error(e.response?.data?.error || 'Failed'); }
    };

    const handleStart = async (id) => {
        try {
            const r = await startLiveClass(id);
            if (r.start_url) window.open(r.start_url, '_blank');
            else toast.info('Live class is not configured for direct start.');
        } catch (e) { toast.error(e.response?.data?.error || 'Failed'); }
    };

    return (
        <div className="w-full">
            <div className="flex items-center mb-3 flex-wrap gap-2">
                <button className="ol-btn-light ol-btn-sm" onClick={() => setModal({ type: 'add' })}>Add live class</button>
            </div>

            {items.length === 0 ? (
                <div className="text-center py-10 text-[14px] text-gray border border-dashed border-border rounded-ol-12">No live classes yet.</div>
            ) : (
                <ul className="flex flex-col gap-2">
                    {items.map((c) => (
                        <li key={c.id} className="ol-card border border-ebordermuted px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
                            <div className="flex-1 min-w-[200px]">
                                <h4 className="text-[15px] font-semibold text-dark m-0">{c.class_topic}</h4>
                                <p className="text-[13px] text-gray m-0">{fmt(c.class_date_and_time)} · {c.provider}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button type="button" className="ol-btn-outline-secondary ol-btn-sm" onClick={() => handleStart(c.id)}>Start</button>
                                <button type="button" title="Edit" className="text-skin px-2" onClick={() => setModal({ type: 'edit', liveClass: c })}><span className="fi-rr-pencil" /></button>
                                <button type="button" title="Delete" className="text-danger px-2" onClick={() => setConfirm({ id: c.id, label: c.class_topic })}><span className="fi-rr-trash" /></button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            {modal?.type === 'add' && (
                <Modal title="Add live class" onClose={() => setModal(null)} size="lg">
                    <LiveClassForm course={course} onDone={() => { toast.success('Live class added successfully'); setModal(null); load(); }} />
                </Modal>
            )}
            {modal?.type === 'edit' && (
                <Modal title="Edit live class" onClose={() => setModal(null)} size="lg">
                    <LiveClassForm course={course} liveClass={modal.liveClass} onDone={() => { toast.success('Live class updated successfully'); setModal(null); load(); }} />
                </Modal>
            )}
            {confirm && (
                <ConfirmDialog
                    title="Delete live class"
                    message={`Are you sure you want to delete ${confirm.label}?`}
                    onCancel={() => setConfirm(null)}
                    onConfirm={() => handleDelete(confirm.id)}
                />
            )}
        </div>
    );
}
