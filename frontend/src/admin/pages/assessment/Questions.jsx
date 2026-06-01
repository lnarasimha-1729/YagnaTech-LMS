import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import QuestionForm from './QuestionForm';
import {
    listQuestions,
    createQuestion,
    updateQuestion,
    deleteQuestion,
} from '../../api/assessment';

export default function Questions() {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [search, setSearch] = useState('');
    const [createOpen, setCreateOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null);

    const load = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await listQuestions();
            setRows(Array.isArray(data) ? data : []);
        } catch (e) {
            setError(e?.response?.data?.message || e?.message || 'Failed to load questions');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const filtered = rows.filter((q) => {
        if (!search.trim()) return true;
        const s = search.toLowerCase();
        return (
            q.quesId?.toLowerCase().includes(s) ||
            q.question?.toLowerCase().includes(s) ||
            q.category?.toLowerCase().includes(s)
        );
    });

    const handleCreate = async (data) => {
        setSubmitting(true);
        try {
            await createQuestion(data);
            toast.success('Question created');
            setCreateOpen(false);
            load();
        } catch (e) {
            toast.error(e?.response?.data?.message || 'Failed to create question');
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdate = async (data) => {
        if (!editing) return;
        setSubmitting(true);
        try {
            await updateQuestion(editing.quesId, data);
            toast.success('Question updated');
            setEditing(null);
            load();
        } catch (e) {
            toast.error(e?.response?.data?.message || 'Failed to update question');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteQuestion(id);
            toast.success('Question deleted');
            setConfirmDelete(null);
            load();
        } catch (e) {
            toast.error(e?.response?.data?.message || 'Failed to delete question');
            setConfirmDelete(null);
        }
    };

    return (
        <div>
            <div className="ol-card rounded-ol-8 mb-3">
                <div className="ol-card-body py-12px px-20px my-3">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <h4 className="text-[16px] font-semibold text-dark m-0 flex items-center gap-2">
                            <i className="fi-rr-interrogation" />
                            Questions{' '}
                            <span className="text-muted font-normal">({rows.length})</span>
                        </h4>
                        <div className="flex items-center gap-2">
                            <input
                                type="search"
                                placeholder="Search by ID, text, or category…"
                                className="ol-form-control w-[260px]"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            <button
                                type="button"
                                className="ol-btn-outline-secondary flex items-center gap-10px"
                                onClick={() => setCreateOpen(true)}
                            >
                                <span className="fi-rr-plus" />
                                <span>Add Question</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {loading && (
                <div className="ol-card rounded-ol-8">
                    <div className="ol-card-body py-10 px-6 text-center">
                        <p className="text-[13px] text-gray m-0">Loading questions…</p>
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

            {!loading && !error && filtered.length === 0 && (
                <div className="ol-card rounded-ol-8">
                    <div className="ol-card-body py-10 px-6 text-center">
                        <p className="text-[14px] text-gray m-0">
                            {rows.length === 0
                                ? 'No questions yet. Click Add Question to create one.'
                                : 'No questions match your search.'}
                        </p>
                    </div>
                </div>
            )}

            {!loading && !error && filtered.length > 0 && (
                <div className="ol-card rounded-ol-8">
                    <div className="ol-card-body p-0 overflow-x-auto e-table-scroll-y">
                        <table className="e-table w-full">
                            <thead>
                                <tr>
                                    <th className="w-[80px]">ID</th>
                                    <th>Question</th>
                                    <th className="w-[120px]">Category</th>
                                    <th className="w-[100px]">Severity</th>
                                    <th className="w-[110px]">Correct</th>
                                    <th className="w-[140px]">Options</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((q) => (
                                    <tr key={q.quesId}>
                                        <td className="font-semibold text-dark">{q.quesId}</td>
                                        <td>
                                            <span className="text-[13px] text-dark line-clamp-2 max-w-[520px]">
                                                {q.question}
                                            </span>
                                        </td>
                                        <td>
                                            {q.category ? (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[11px]">
                                                    {q.category}
                                                </span>
                                            ) : (
                                                <span className="text-[11px] text-muted">—</span>
                                            )}
                                        </td>
                                        <td>
                                            <SeverityBadge severity={q.questionSeverity} />
                                        </td>
                                        <td>
                                            <span className="text-[12px] text-dark">
                                                {q.correctAns}
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                type="button"
                                                className="text-[12px] text-skin font-semibold mr-3"
                                                onClick={() => setEditing(q)}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                className="text-[12px] text-danger font-semibold"
                                                onClick={() => setConfirmDelete(q.quesId)}
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
                <Modal title="Add Question" size="lg" onClose={() => setCreateOpen(false)}>
                    <QuestionForm
                        mode="create"
                        onSubmit={handleCreate}
                        submitting={submitting}
                    />
                </Modal>
            )}

            {editing && (
                <Modal
                    title={`Edit Question — ${editing.quesId}`}
                    size="lg"
                    onClose={() => setEditing(null)}
                >
                    <QuestionForm
                        mode="edit"
                        initial={editing}
                        onSubmit={handleUpdate}
                        submitting={submitting}
                    />
                </Modal>
            )}

            {confirmDelete && (
                <ConfirmDialog
                    message={`Delete question ${confirmDelete}? This cannot be undone.`}
                    onCancel={() => setConfirmDelete(null)}
                    onConfirm={() => handleDelete(confirmDelete)}
                />
            )}
        </div>
    );
}

function SeverityBadge({ severity }) {
    const map = {
        easy: 'bg-green-100 text-green-700',
        medium: 'bg-yellow-100 text-yellow-700',
        hard: 'bg-red-100 text-red-700',
    };
    if (!severity) return <span className="text-[11px] text-muted">—</span>;
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${map[severity] || 'bg-gray-100 text-gray-700'}`}>
            {severity}
        </span>
    );
}
