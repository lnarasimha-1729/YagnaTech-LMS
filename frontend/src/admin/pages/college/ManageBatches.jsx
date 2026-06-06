import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import ExportMenu from '../../components/ExportMenu';
import {
    listBatches,
    getBatch,
    updateBatch,
    deleteBatch,
    addBatchMembers,
    removeBatchMember,
    listEligibleStudents,
} from '../../api/batch';

// Manage Batches tab. Lists every batch for the caller's college, with
// edit/delete and a "manage students" drawer that lets the admin add or
// remove members.
export default function ManageBatches({ refreshKey }) {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editing, setEditing] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [managing, setManaging] = useState(null);

    const load = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await listBatches();
            setRows(Array.isArray(data?.batches) ? data.batches : []);
        } catch (e) {
            setError(e?.response?.data?.error || e?.message || 'Failed to load batches');
        } finally {
            setLoading(false);
        }
    };

    // refreshKey is bumped by the parent every time a new batch is created
    // via the Add Batch tab, so this list stays fresh without a page reload.
    useEffect(() => { load(); /* eslint-disable-next-line */ }, [refreshKey]);

    const handleDelete = async (id) => {
        try {
            await deleteBatch(id);
            toast.success('Batch deleted');
            setConfirmDelete(null);
            load();
        } catch (e) {
            toast.error(e?.response?.data?.error || 'Failed to delete batch');
            setConfirmDelete(null);
        }
    };

    return (
        <div>
            <div className="ol-card rounded-ol-8 mb-3">
                <div className="ol-card-body py-12px px-20px my-3">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <h4 className="text-[16px] font-semibold text-dark m-0 flex items-center gap-2">
                            <i className="fi-rr-users-alt" />
                            Manage Batches{' '}
                            <span className="text-muted font-normal">({rows.length})</span>
                        </h4>
                        <div className="flex items-center gap-2">
                            {rows.length > 0 && (
                                <ExportMenu onPdf={() => window.print()} onPrint={() => window.print()} align="right" />
                            )}
                            <button
                                type="button"
                                className="ol-btn-outline-secondary"
                                onClick={load}
                                disabled={loading}
                            >
                                {loading ? 'Refreshing…' : 'Refresh'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {loading && (
                <div className="ol-card rounded-ol-8">
                    <div className="ol-card-body py-10 px-6 text-center">
                        <p className="text-[13px] text-gray m-0">Loading batches…</p>
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
                            No batches yet. Switch to <strong>Add Batch</strong> to create one.
                        </p>
                    </div>
                </div>
            )}

            {!loading && !error && rows.length > 0 && (
                <div className="ol-card rounded-ol-8">
                    <div className="ol-card-body p-0 overflow-x-auto print-area">
                        <table className="e-table w-full">
                            <thead>
                                <tr>
                                    <th className="w-[60px]">#</th>
                                    <th>Batch</th>
                                    <th className="w-[140px]">Members</th>
                                    <th className="w-[180px]">Schedule</th>
                                    <th className="w-[100px]">Status</th>
                                    <th className="w-[220px] no-print">Options</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((b, i) => (
                                    <tr key={b.id}>
                                        <td>{i + 1}</td>
                                        <td>
                                            <div className="flex flex-col">
                                                <span className="text-[14px] font-semibold text-dark">
                                                    {b.name}
                                                </span>
                                                {b.description && (
                                                    <span className="text-[12px] text-gray truncate max-w-[420px]">
                                                        {b.description}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <span className="text-[13px] text-dark font-medium">
                                                {b.member_count ?? 0}
                                            </span>
                                            <span className="text-[11px] text-gray ml-1">
                                                student{b.member_count === 1 ? '' : 's'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="text-[12px] text-dark">
                                                {formatRange(b.start_date, b.end_date)}
                                            </span>
                                        </td>
                                        <td>
                                            <StatusBadge active={b.is_active} />
                                        </td>
                                        <td className="no-print">
                                            <button
                                                type="button"
                                                className="text-[12px] text-skin font-semibold mr-3"
                                                onClick={() => setManaging(b)}
                                            >
                                                Students
                                            </button>
                                            <button
                                                type="button"
                                                className="text-[12px] text-skin font-semibold mr-3"
                                                onClick={() => setEditing(b)}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                className="text-[12px] text-danger font-semibold"
                                                onClick={() => setConfirmDelete({ id: b.id, name: b.name })}
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

            {editing && (
                <Modal title={`Edit Batch — ${editing.name}`} size="lg" onClose={() => setEditing(null)}>
                    <EditBatchForm
                        batch={editing}
                        onSaved={() => { setEditing(null); load(); }}
                    />
                </Modal>
            )}

            {managing && (
                <Modal
                    title={`Students — ${managing.name}`}
                    size="xl"
                    onClose={() => { setManaging(null); load(); }}
                >
                    <ManageMembers
                        batchId={managing.id}
                        onChanged={load}
                    />
                </Modal>
            )}

            {confirmDelete && (
                <ConfirmDialog
                    message={`Delete batch "${confirmDelete.name}"? Members will be unassigned but their accounts stay.`}
                    onCancel={() => setConfirmDelete(null)}
                    onConfirm={() => handleDelete(confirmDelete.id)}
                />
            )}
        </div>
    );
}

function formatRange(start, end) {
    if (!start && !end) return '—';
    const fmt = (d) => {
        if (!d) return '?';
        try { return new Date(d).toLocaleDateString(); } catch { return d; }
    };
    if (start && end) return `${fmt(start)} → ${fmt(end)}`;
    if (start) return `from ${fmt(start)}`;
    return `until ${fmt(end)}`;
}

function StatusBadge({ active }) {
    // MySQL TINYINT(1) comes back as a number (0/1), not a real bool — strict
    // === false used to miss the 0 case. Treat any falsy value as inactive.
    if (!active) {
        return (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-600">
                Inactive
            </span>
        );
    }
    return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-green-100 text-green-700">
            Active
        </span>
    );
}

// ── Edit form ───────────────────────────────────────────────────────────────
function EditBatchForm({ batch, onSaved }) {
    const [name, setName] = useState(batch.name || '');
    const [description, setDescription] = useState(batch.description || '');
    const [startDate, setStartDate] = useState(batch.start_date || '');
    const [endDate, setEndDate] = useState(batch.end_date || '');
    // Coerce defensively — MySQL TINYINT(1) round-trips as 0/1, not true/false,
    // so `!== false` would always be true and the dropdown would always start
    // on "Active" even for an already-inactive batch.
    const [isActive, setIsActive] = useState(Boolean(batch.is_active));
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!name.trim()) return setError('Batch name is required');
        if (startDate && endDate && startDate > endDate) {
            return setError('End date must be after the start date');
        }
        setSubmitting(true);
        try {
            await updateBatch(batch.id, {
                name: name.trim(),
                description: description.trim() || null,
                start_date: startDate || null,
                end_date: endDate || null,
                is_active: isActive,
            });
            toast.success('Batch updated');
            onSaved?.();
        } catch (e) {
            toast.error(e?.response?.data?.error || 'Failed to update batch');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
                <div className="px-3 py-2 rounded bg-red-50 text-red-700 text-[13px]">
                    {error}
                </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-[13px] font-semibold text-dark mb-1">
                        Batch Name <span className="text-danger">*</span>
                    </label>
                    <input
                        type="text"
                        className="ol-form-control w-full"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-[13px] font-semibold text-dark mb-1">
                        Status
                    </label>
                    <select
                        className="ol-form-control w-full"
                        value={isActive ? '1' : '0'}
                        onChange={(e) => setIsActive(e.target.value === '1')}
                    >
                        <option value="1">Active</option>
                        <option value="0">Inactive</option>
                    </select>
                </div>
            </div>
            <div>
                <label className="block text-[13px] font-semibold text-dark mb-1">
                    Description
                </label>
                <textarea
                    className="ol-form-control w-full"
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-[13px] font-semibold text-dark mb-1">
                        Start Date
                    </label>
                    <input
                        type="date"
                        className="ol-form-control w-full"
                        value={startDate || ''}
                        onChange={(e) => setStartDate(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-[13px] font-semibold text-dark mb-1">
                        End Date
                    </label>
                    <input
                        type="date"
                        className="ol-form-control w-full"
                        value={endDate || ''}
                        onChange={(e) => setEndDate(e.target.value)}
                    />
                </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
                <button type="submit" className="ol-btn-primary" disabled={submitting}>
                    {submitting ? 'Saving…' : 'Save changes'}
                </button>
            </div>
        </form>
    );
}

// ── Members manager (inside the modal) ──────────────────────────────────────
function ManageMembers({ batchId, onChanged }) {
    const [batch, setBatch] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [allStudents, setAllStudents] = useState([]);
    const [search, setSearch] = useState('');
    const [pendingIds, setPendingIds] = useState([]);
    const [adding, setAdding] = useState(false);
    const [removingId, setRemovingId] = useState(null);

    const load = async () => {
        setLoading(true);
        setError(null);
        try {
            const [b, e] = await Promise.all([getBatch(batchId), listEligibleStudents()]);
            setBatch(b?.batch || null);
            setAllStudents(Array.isArray(e?.students) ? e.students : []);
        } catch (err) {
            setError(err?.response?.data?.error || 'Failed to load batch');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); /* eslint-disable-next-line */ }, [batchId]);

    const memberIds = useMemo(() => new Set((batch?.students || []).map((s) => String(s.id))), [batch]);

    const candidates = useMemo(() => {
        const q = search.trim().toLowerCase();
        return allStudents
            .filter((s) => !memberIds.has(String(s.id)))
            .filter((s) => {
                if (!q) return true;
                return (
                    (s.name || '').toLowerCase().includes(q) ||
                    (s.email || '').toLowerCase().includes(q)
                );
            });
    }, [allStudents, memberIds, search]);

    const toggleCandidate = (id) => {
        const s = String(id);
        setPendingIds((cur) =>
            cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]
        );
    };

    const handleAdd = async () => {
        if (pendingIds.length === 0) return;
        setAdding(true);
        try {
            const res = await addBatchMembers(batchId, pendingIds);
            toast.success(res?.message || `Added ${pendingIds.length}`);
            setPendingIds([]);
            setSearch('');
            setBatch(res?.batch || batch);
            onChanged?.();
        } catch (e) {
            toast.error(e?.response?.data?.error || 'Failed to add students');
        } finally {
            setAdding(false);
        }
    };

    const handleRemove = async (uid) => {
        setRemovingId(uid);
        try {
            await removeBatchMember(batchId, uid);
            toast.success('Student removed');
            await load();
            onChanged?.();
        } catch (e) {
            toast.error(e?.response?.data?.error || 'Failed to remove student');
        } finally {
            setRemovingId(null);
        }
    };

    if (loading) {
        return <p className="text-[13px] text-gray text-center py-6">Loading…</p>;
    }
    if (error) {
        return (
            <div className="text-center py-6">
                <p className="text-[14px] text-danger mb-3">{error}</p>
                <button className="ol-btn-primary" onClick={load}>Retry</button>
            </div>
        );
    }

    const members = batch?.students || [];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Current roster */}
            <div className="ol-card rounded-ol-8">
                <div className="px-4 py-3 border-b border-border">
                    <h6 className="text-[13px] font-semibold text-dark m-0">
                        Current members{' '}
                        <span className="text-muted font-normal">({members.length})</span>
                    </h6>
                </div>
                <div className="max-h-[360px] overflow-y-auto">
                    {members.length === 0 && (
                        <p className="px-4 py-6 text-center text-[12px] text-gray m-0">
                            No students in this batch yet.
                        </p>
                    )}
                    {members.map((s) => (
                        <div
                            key={s.id}
                            className="flex items-center gap-3 px-4 py-2 border-b border-border text-[13px]"
                        >
                            <div className="flex-1 min-w-0">
                                <p className="text-dark font-medium m-0 truncate">
                                    {s.name || '—'}
                                </p>
                                <p className="text-gray text-[11px] m-0 truncate">
                                    {s.email}
                                    {s.graduationYear ? ` · ${s.graduationYear}` : ''}
                                </p>
                            </div>
                            <button
                                type="button"
                                className="text-[12px] text-danger font-semibold disabled:opacity-50"
                                onClick={() => handleRemove(s.id)}
                                disabled={removingId === s.id}
                            >
                                {removingId === s.id ? 'Removing…' : 'Remove'}
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Add picker */}
            <div className="ol-card rounded-ol-8">
                <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                    <h6 className="text-[13px] font-semibold text-dark m-0">
                        Add students{' '}
                        <span className="text-muted font-normal">
                            ({pendingIds.length} picked)
                        </span>
                    </h6>
                    <input
                        type="search"
                        placeholder="Search…"
                        className="ol-form-control h-[32px] text-[12px] w-[180px]"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                    {candidates.length === 0 && (
                        <p className="px-4 py-6 text-center text-[12px] text-gray m-0">
                            {allStudents.length === 0
                                ? 'No students at your college yet.'
                                : 'No eligible students left to add.'}
                        </p>
                    )}
                    {candidates.map((s) => {
                        const id = String(s.id);
                        const picked = pendingIds.includes(id);
                        return (
                            <label
                                key={id}
                                className={`flex items-start gap-2 px-4 py-2 border-b border-border cursor-pointer text-[13px] ${
                                    picked ? 'bg-emerald-50' : 'hover:bg-gray-50'
                                }`}
                            >
                                <input
                                    type="checkbox"
                                    className="mt-1"
                                    checked={picked}
                                    onChange={() => toggleCandidate(id)}
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="text-dark font-medium m-0 truncate">
                                        {s.name || '—'}
                                    </p>
                                    <p className="text-gray text-[11px] m-0 truncate">
                                        {s.email}
                                    </p>
                                </div>
                            </label>
                        );
                    })}
                </div>
                <div className="px-4 py-3 border-t border-border flex justify-end">
                    <button
                        type="button"
                        className="ol-btn-primary text-[13px] disabled:opacity-50"
                        onClick={handleAdd}
                        disabled={adding || pendingIds.length === 0}
                    >
                        {adding ? 'Adding…' : `Add ${pendingIds.length || ''} student(s)`}
                    </button>
                </div>
            </div>
        </div>
    );
}
