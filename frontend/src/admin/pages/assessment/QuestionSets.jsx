import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import QuestionSetForm from './QuestionSetForm';
import {
    listQuestionSets,
    getQuestionSet,
    createQuestionSet,
    updateQuestionSet,
    deleteQuestionSet,
} from '../../api/assessment';

export default function QuestionSets() {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [createOpen, setCreateOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [editingLoading, setEditingLoading] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(null);

    const load = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await listQuestionSets();
            setRows(Array.isArray(data) ? data : []);
        } catch (e) {
            setError(e?.response?.data?.message || e?.message || 'Failed to load question sets');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const openEdit = async (setId) => {
        setEditingLoading(true);
        try {
            const data = await getQuestionSet(setId);
            setEditing(data);
        } catch (e) {
            toast.error(e?.response?.data?.message || 'Failed to load question set');
        } finally {
            setEditingLoading(false);
        }
    };

    const handleCreate = async (data) => {
        setSubmitting(true);
        try {
            await createQuestionSet(data);
            toast.success('Question set created');
            setCreateOpen(false);
            load();
        } catch (e) {
            toast.error(e?.response?.data?.message || 'Failed to create question set');
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdate = async (data) => {
        if (!editing) return;
        setSubmitting(true);
        try {
            await updateQuestionSet(editing.setId, data);
            toast.success('Question set updated');
            setEditing(null);
            load();
        } catch (e) {
            toast.error(e?.response?.data?.message || 'Failed to update question set');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteQuestionSet(id);
            toast.success('Question set deleted');
            setConfirmDelete(null);
            load();
        } catch (e) {
            toast.error(e?.response?.data?.message || 'Failed to delete question set');
            setConfirmDelete(null);
        }
    };

    return (
        <div>
            <div className="ol-card rounded-ol-8 mb-3">
                <div className="ol-card-body py-12px px-20px my-3">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <h4 className="text-[16px] font-semibold text-dark m-0 flex items-center gap-2">
                            <i className="fi-rr-list-check" />
                            Question Sets{' '}
                            <span className="text-muted font-normal">({rows.length})</span>
                        </h4>
                        <button
                            type="button"
                            className="ol-btn-outline-secondary flex items-center gap-10px"
                            onClick={() => setCreateOpen(true)}
                        >
                            <span className="fi-rr-plus" />
                            <span>Add Question Set</span>
                        </button>
                    </div>
                </div>
            </div>

            {loading && (
                <div className="ol-card rounded-ol-8">
                    <div className="ol-card-body py-10 px-6 text-center">
                        <p className="text-[13px] text-gray m-0">Loading question sets…</p>
                    </div>
                </div>
            )}

            {error && !loading && (
                <div className="ol-card rounded-ol-8">
                    <div className="ol-card-body py-10 px-6 text-center">
                        <p className="text-[14px] text-danger mb-3">{error}</p>
                        <button className="ol-btn-primary" onClick={load}>Retry</button>
                    </div>
                </div>
            )}

            {!loading && !error && rows.length === 0 && (
                <div className="ol-card rounded-ol-8">
                    <div className="ol-card-body py-10 px-6 text-center">
                        <p className="text-[14px] text-gray m-0">
                            No question sets yet. Click <strong>Add Question Set</strong> to create one.
                        </p>
                    </div>
                </div>
            )}

            {!loading && !error && rows.length > 0 && (
                <div className="ol-card rounded-ol-8">
                    <div className="ol-card-body p-0 overflow-x-auto e-table-scroll-y">
                        <table className="e-table w-full">
                            <thead>
                                <tr>
                                    <th className="w-[60px]">#</th>
                                    <th>Set ID</th>
                                    <th>Set Name</th>
                                    <th className="w-[140px]">Category</th>
                                    <th className="w-[110px]">Questions</th>
                                    <th className="w-[160px]">Options</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((qs, i) => (
                                    <tr key={qs.setId}>
                                        <td>{i + 1}</td>
                                        <td className="font-semibold text-dark">{qs.setId}</td>
                                        <td>{qs.setName}</td>
                                        <td>
                                            {qs.category ? (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[11px]">
                                                    {qs.category}
                                                </span>
                                            ) : (
                                                <span className="text-[11px] text-muted">—</span>
                                            )}
                                        </td>
                                        <td>
                                            <span className="text-[12px] text-dark font-medium">
                                                {Array.isArray(qs.questions) ? qs.questions.length : 0}
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                type="button"
                                                className="text-[12px] text-skin font-semibold mr-3"
                                                onClick={() => openEdit(qs.setId)}
                                                disabled={editingLoading}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                className="text-[12px] text-danger font-semibold"
                                                onClick={() => setConfirmDelete(qs.setId)}
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {createOpen && (
                <Modal title="Add Question Set" size="xl" onClose={() => setCreateOpen(false)}>
                    <QuestionSetForm
                        mode="create"
                        onSubmit={handleCreate}
                        submitting={submitting}
                    />
                </Modal>
            )}

            {editing && (
                <Modal
                    title={`Edit Question Set — ${editing.setId}`}
                    size="xl"
                    onClose={() => setEditing(null)}
                >
                    <QuestionSetForm
                        mode="edit"
                        initial={editing}
                        onSubmit={handleUpdate}
                        submitting={submitting}
                    />
                </Modal>
            )}

            {confirmDelete && (
                <ConfirmDialog
                    message={`Delete question set ${confirmDelete}? Assessments using this set will break.`}
                    onCancel={() => setConfirmDelete(null)}
                    onConfirm={() => handleDelete(confirmDelete)}
                />
            )}
        </div>
    );
}
