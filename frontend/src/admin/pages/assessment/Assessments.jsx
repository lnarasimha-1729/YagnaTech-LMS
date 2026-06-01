import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import AssessmentForm from './AssessmentForm';
import {
    listAssessments,
    createAssessment,
    updateAssessment,
    deleteAssessment,
} from '../../api/assessment';
import { listCourses } from '../../api/course';
import { useCollege } from '@/hooks/useCollege';

export default function Assessments() {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [createOpen, setCreateOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null);

    // Resolve clgId -> clgName + course id -> title so the table renders
    // human-readable chips instead of raw ids. Both hydrate once on mount;
    // the colleges hook is cached by CollegeProvider so it stays warm.
    const { colleges } = useCollege();
    const collegeNameById = useMemo(() => {
        const map = {};
        (colleges || []).forEach((c) => { map[c.clgId] = c.clgName; });
        return map;
    }, [colleges]);
    const [courseById, setCourseById] = useState({});
    useEffect(() => {
        let alive = true;
        listCourses({})
            .then((r) => {
                if (!alive) return;
                const rs = Array.isArray(r?.courses?.data) ? r.courses.data : [];
                const map = {};
                rs.forEach((c) => { map[String(c.id)] = c.title; });
                setCourseById(map);
            })
            .catch(() => { /* best-effort — table falls back to raw id */ });
        return () => { alive = false; };
    }, []);

    const load = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await listAssessments();
            setRows(Array.isArray(data) ? data : []);
        } catch (e) {
            setError(e?.response?.data?.message || e?.message || 'Failed to load assessments');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const handleCreate = async (data) => {
        setSubmitting(true);
        try {
            await createAssessment(data);
            toast.success('Assessment created');
            setCreateOpen(false);
            load();
        } catch (e) {
            toast.error(e?.response?.data?.message || 'Failed to create assessment');
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdate = async (data) => {
        if (!editing) return;
        setSubmitting(true);
        try {
            // assessmentId is immutable on edit — strip it from payload to be safe.
            const { assessmentId: _ignored, ...rest } = data;
            await updateAssessment(editing.assessmentId, rest);
            toast.success('Assessment updated');
            setEditing(null);
            load();
        } catch (e) {
            toast.error(e?.response?.data?.message || 'Failed to update assessment');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteAssessment(id);
            toast.success('Assessment deleted');
            setConfirmDelete(null);
            load();
        } catch (e) {
            toast.error(e?.response?.data?.message || 'Failed to delete assessment');
            setConfirmDelete(null);
        }
    };

    return (
        <div>
            <div className="ol-card rounded-ol-8 mb-3">
                <div className="ol-card-body py-12px px-20px my-3">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <h4 className="text-[16px] font-semibold text-dark m-0 flex items-center gap-2">
                            <i className="fi-rr-file-edit" />
                            Assessments{' '}
                            <span className="text-muted font-normal">({rows.length})</span>
                        </h4>
                        <button
                            type="button"
                            className="ol-btn-outline-secondary flex items-center gap-10px"
                            onClick={() => setCreateOpen(true)}
                        >
                            <span className="fi-rr-plus" />
                            <span>Add Assessment</span>
                        </button>
                    </div>
                </div>
            </div>

            {loading && (
                <div className="ol-card rounded-ol-8">
                    <div className="ol-card-body py-10 px-6 text-center">
                        <p className="text-[13px] text-gray m-0">Loading assessments…</p>
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
                            No assessments yet. Click <strong>Add Assessment</strong> to create one.
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
                                    <th>ID</th>
                                    <th className="w-[100px]">Type</th>
                                    <th>Question Set</th>
                                    <th>Colleges</th>
                                    <th>Courses</th>
                                    <th className="w-[100px]">Timer</th>
                                    <th className="w-[90px]">Score</th>
                                    <th className="w-[120px]">Status</th>
                                    <th className="w-[160px]">Options</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((a, i) => (
                                    <tr key={a.assessmentId}>
                                        <td>{i + 1}</td>
                                        <td className="font-semibold text-dark">
                                            {a.assessmentId}
                                        </td>
                                        <td>
                                            <TypeBadge type={a.type} />
                                        </td>
                                        <td>
                                            <div className="flex flex-col">
                                                <span className="text-[13px] text-dark font-medium">
                                                    {a.QuestionSet?.setName || a.setId}
                                                </span>
                                                <span className="text-[11px] text-gray">
                                                    {a.setId}
                                                    {a.QuestionSet?.questions
                                                        ? ` · ${a.QuestionSet.questions.length} questions`
                                                        : ''}
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <IdChips
                                                ids={Array.isArray(a.clgIds) ? a.clgIds : []}
                                                nameById={collegeNameById}
                                                empty="No colleges assigned"
                                            />
                                        </td>
                                        <td>
                                            <IdChips
                                                ids={Array.isArray(a.courseIds) ? a.courseIds : []}
                                                nameById={courseById}
                                                empty="No courses assigned"
                                                idPrefix="#"
                                            />
                                        </td>
                                        <td>
                                            <span className="text-[12px] text-dark">
                                                {a.timer ? `${Math.round(a.timer / 60)} min` : '—'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="text-[12px] text-dark">
                                                {a.score ?? '—'}
                                            </span>
                                        </td>
                                        <td>
                                            <StatusBadge status={a.status} />
                                        </td>
                                        <td>
                                            <button
                                                type="button"
                                                className="text-[12px] text-skin font-semibold mr-3"
                                                onClick={() => setEditing(a)}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                className="text-[12px] text-danger font-semibold"
                                                onClick={() => setConfirmDelete(a.assessmentId)}
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
                <Modal title="Add Assessment" size="lg" onClose={() => setCreateOpen(false)}>
                    <AssessmentForm
                        mode="create"
                        onSubmit={handleCreate}
                        submitting={submitting}
                    />
                </Modal>
            )}

            {editing && (
                <Modal
                    title={`Edit Assessment — ${editing.assessmentId}`}
                    size="lg"
                    onClose={() => setEditing(null)}
                >
                    <AssessmentForm
                        mode="edit"
                        initial={editing}
                        onSubmit={handleUpdate}
                        submitting={submitting}
                    />
                </Modal>
            )}

            {confirmDelete && (
                <ConfirmDialog
                    message={`Delete assessment ${confirmDelete}? This cannot be undone.`}
                    onCancel={() => setConfirmDelete(null)}
                    onConfirm={() => handleDelete(confirmDelete)}
                />
            )}
        </div>
    );
}

function TypeBadge({ type }) {
    if (type === 'pre') {
        return (
            <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-[11px] font-medium">
                Pre
            </span>
        );
    }
    if (type === 'post') {
        return (
            <span className="inline-flex items-center px-2 py-0.5 rounded bg-purple-100 text-purple-700 text-[11px] font-medium">
                Post
            </span>
        );
    }
    return <span className="text-[11px] text-muted">{type || '—'}</span>;
}

function StatusBadge({ status }) {
    const map = {
        'not-started': 'bg-gray-100 text-gray-700',
        'available': 'bg-green-100 text-green-700',
        'in-progress': 'bg-yellow-100 text-yellow-700',
        'completed': 'bg-blue-100 text-blue-700',
        'expired': 'bg-red-100 text-red-700',
    };
    if (!status) return <span className="text-[11px] text-muted">—</span>;
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${map[status] || 'bg-gray-100 text-gray-700'}`}>
            {status}
        </span>
    );
}

// Inline chip strip used by both the Colleges and Courses columns. Shows up
// to two chips with the resolved name; the rest collapse into a "+N more"
// pill (tooltip lists the overflow). Same treatment Manage Programs uses.
const MAX_VISIBLE_CHIPS = 2;
function IdChips({ ids, nameById, empty, idPrefix = '' }) {
    const list = Array.isArray(ids) ? ids.filter((v) => v !== null && v !== undefined && v !== '') : [];
    if (list.length === 0) {
        return <span className="text-[11px] text-muted">{empty}</span>;
    }
    const labelFor = (id) => nameById[String(id)] || `${idPrefix}${id}`;
    const visible = list.slice(0, MAX_VISIBLE_CHIPS);
    const hiddenCount = list.length - visible.length;
    const hiddenLabel = list.slice(MAX_VISIBLE_CHIPS).map(labelFor).join(', ');
    return (
        <div className="flex flex-wrap items-center gap-1">
            {visible.map((id) => {
                const label = labelFor(id);
                return (
                    <span
                        key={id}
                        className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[11px] max-w-[160px] truncate"
                        title={label}
                    >
                        {label}
                    </span>
                );
            })}
            {hiddenCount > 0 && (
                <span
                    className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-[11px]"
                    title={hiddenLabel}
                >
                    +{hiddenCount} more
                </span>
            )}
        </div>
    );
}
