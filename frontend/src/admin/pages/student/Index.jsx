import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import ConfirmDialog from '../../components/ConfirmDialog';
import Modal from '../../components/Modal';
import { listStudents, deleteStudent, listStudentColleges, sendProgramRequest } from '../../api/student';
import { listColleges } from '../../api/college';
import { listBatchesByColleges } from '../../api/batch';
import { listProgramsForCollegeBatch } from '../../api/program';
import { BsThreeDotsVertical } from 'react-icons/bs';

const API = import.meta.env.VITE_ADMIN_API_URL || 'http://localhost:4000';

// Pre-assessment time taken: seconds → "Mm Ss" (or "Ss" under a minute).
// Null/undefined means the duration wasn't recorded (older attempts).
const fmtDuration = (secs) => {
    if (secs == null || Number.isNaN(Number(secs))) return 'N/A';
    const s = Math.max(0, Math.round(Number(secs)));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return m > 0 ? `${m}m ${r}s` : `${r}s`;
};

const avatarUrl = (row) => row.photo
    ? `${API}/${row.photo}`
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(row.name || row.email || 'S')}&background=169f48&color=fff`;

export default function StudentIndex() {
    const [params, setParams] = useSearchParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [confirm, setConfirm] = useState(null);
    const [bulkOpen, setBulkOpen] = useState(false);

    // Show every student on one page (no pager rendered). A high per_page
    // returns all signed-up students in a single request; search still works
    // because the backend applies the filter before paginating.
    const query = { per_page: 1000, ...Object.fromEntries(params.entries()) };

    const load = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await listStudents(query);
            setData(res);
        } catch (err) {
            setError(err?.response?.data?.error || err?.message || 'Failed to load students');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); /* eslint-disable-next-line */ }, [params]);

    const onSearch = (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const term = (fd.get('search') || '').toString().trim();
        const next = { ...query };
        if (term) next.search = term; else delete next.search;
        setParams(next);
    };

    // College filter → URL param so it composes with search and survives
    // reload. Empty value clears the filter. Changing the college also wipes
    // the batch filter because a batch is meaningful only inside its college
    // — leaving a stale batch param would silently empty the table.
    const onCollegeFilter = (value) => {
        const next = { ...query };
        if (value) next.college = value; else delete next.college;
        delete next.batch;
        delete next.per_page;
        setParams(next);
    };

    // Batch filter → URL param. Only meaningful while a college is selected;
    // the BatchFilter UI enforces that gate so this just round-trips.
    const onBatchFilter = (value) => {
        const next = { ...query };
        if (value) next.batch = value; else delete next.batch;
        delete next.per_page;
        setParams(next);
    };

    const handleDelete = async (id) => {
        try {
            await deleteStudent(id);
            toast.success('Student removed successfully');
            setConfirm(null);
            load();
        } catch (e) {
            toast.error(e.response?.data?.error || 'Failed');
            setConfirm(null);
        }
    };

    const handlePrint = () => window.print();

    if (loading && !data) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-gray">
                <div className="w-10 h-10 border-4 border-gray-200 border-t-skin rounded-full animate-spin mb-3" />
                <p className="text-[14px]">Loading students…</p>
            </div>
        );
    }

    if (error && !data) {
        return (
            <div className="ol-card rounded-ol-8">
                <div className="ol-card-body py-10 px-6 text-center">
                    <p className="text-[16px] font-semibold text-danger mb-2">Couldn’t load students</p>
                    <p className="text-[13px] text-gray mb-4">{error}</p>
                    <button className="ol-btn-primary" onClick={load}>Retry</button>
                </div>
            </div>
        );
    }

    const rows = data.students || [];
    const isEmpty = rows.length === 0;

    return (
        // min-w-0 lets this column shrink below the table's intrinsic width
        // inside the admin layout's flex <main>; without it the wide table
        // pushes the whole page wider and the viewport scrolls horizontally.
        <div className="min-w-0">
            <div className="ol-card rounded-ol-8 mb-3">
                <div className="ol-card-body py-12px px-20px my-3">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <h4 className="text-[16px] font-semibold text-dark m-0 flex items-center gap-2">
                            <i className="fi-rr-settings-sliders" />
                            Student List
                        </h4>
                        <Link
                            to="/admin/students/create"
                            className="ol-btn-outline-secondary flex items-center gap-10px"
                        >
                            <span className="fi-rr-plus" />
                            <span>Add new Student</span>
                        </Link>
                    </div>
                </div>
            </div>

            <div className="ol-card p-3 min-w-0">
                <div className="ol-card-body min-w-0">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3 mt-3">
                        <div className="w-full md:w-auto">
                            <ExportDropdown onPdf={handlePrint} onPrint={handlePrint} />
                        </div>
                        {/* Bulk Request + Batch + College search + Search user grouped on the right. */}
                        <div className="flex flex-col md:flex-row md:items-center gap-3">
                            {/* Bulk Request requires BOTH a college AND a batch
                                so the bulk action targets a well-scoped group
                                rather than every student of a college. */}
                            {query.college && query.batch && (
                                <button
                                    type="button"
                                    className="ol-btn-primary whitespace-nowrap w-full md:w-auto"
                                    onClick={() => setBulkOpen(true)}
                                >
                                    Bulk Request
                                </button>
                            )}
                            {/* Batch sits LEFT of College per the spec; it's
                                disabled until a college is chosen and only
                                lists batches that belong to that college. */}
                            <div className="w-full md:w-[220px]">
                                <BatchFilter
                                    collegeName={query.college || ''}
                                    value={query.batch || ''}
                                    onChange={onBatchFilter}
                                />
                            </div>
                            <div className="w-full md:w-[220px]">
                                <CollegeFilter
                                    value={query.college || ''}
                                    onChange={onCollegeFilter}
                                />
                            </div>
                            <form onSubmit={onSearch} className="flex gap-3">
                                <input
                                    className="ol-form-control w-full md:w-[240px]"
                                    name="search"
                                    type="text"
                                    placeholder="Search user"
                                    defaultValue={query.search || ''}
                                />
                                <button type="submit" className="ol-btn-primary whitespace-nowrap">Search</button>
                            </form>
                        </div>
                    </div>
                    {(query.college || query.batch) && (
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                            {query.college && (
                                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-skin/10 text-skin text-[13px] font-medium">
                                    College: {query.college}
                                    <button
                                        type="button"
                                        className="text-skin hover:text-danger font-bold"
                                        onClick={() => onCollegeFilter('')}
                                        aria-label="Clear college filter"
                                    >
                                        ×
                                    </button>
                                </span>
                            )}
                            {query.batch && (
                                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-skin/10 text-skin text-[13px] font-medium">
                                    Batch: {query.batch}
                                    <button
                                        type="button"
                                        className="text-skin hover:text-danger font-bold"
                                        onClick={() => onBatchFilter('')}
                                        aria-label="Clear batch filter"
                                    >
                                        ×
                                    </button>
                                </span>
                            )}
                        </div>
                    )}

                    {isEmpty ? (
                        <div className="py-12 text-center border border-dashed border-border rounded-ol-8">
                            <p className="text-[16px] font-semibold text-dark mb-1">No students found</p>
                            <p className="text-[13px] text-gray">Try adjusting your search or add a new student.</p>
                        </div>
                    ) : (
                        <>
                            <div className="flex justify-between items-center flex-wrap gap-3 mb-3">
                                <p className="text-gray text-[14px] m-0">
                                    Showing {rows.length} of {data.total} data
                                </p>
                                {loading && <span className="text-[12px] text-gray">Refreshing…</span>}
                            </div>
                            {/* Scrollbar lives on THIS container only — the
                                wide table scrolls here instead of widening
                                the page. w-full + max-w-full + min-w-0 make
                                the box clip rather than grow to fit content. */}
                            <div className="w-full max-w-full min-w-0 overflow-x-auto e-table-scroll-y print-area">
                                <table className="e-table print-compact">
                                    <thead>
                                        <tr>
                                            <th scope="col">#</th>
                                            <th scope="col">Name</th>
                                            <th scope="col">Phone</th>
                                            <th scope="col">College</th>
                                            <th scope="col">Batch</th>
                                            <th scope="col">Enrolled Courses</th>
                                            <th scope="col">Program Interested</th>
                                            <th scope="col">Pre-Assessment</th>
                                            <th scope="col">Post-Assessment</th>
                                            <th scope="col">Course Status</th>
                                            <th scope="col">Certificate Status</th>
                                            <th scope="col">Program Request</th>
                                            <th scope="col">Request Status</th>
                                            <th scope="col" className="no-print">Options</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows.map((s, i) => (
                                            <tr key={s.id}>
                                                <td>{((data.page || 1) - 1) * (data.per_page || rows.length) + i + 1}</td>
                                                <td className="min-w-[220px]">
                                                    <div className="flex items-center gap-3">
                                                        <img
                                                            src={avatarUrl(s)}
                                                            className="w-[42px] h-[42px] rounded-full object-cover shrink-0"
                                                            alt=""
                                                        />
                                                        <div className="min-w-0">
                                                            <h4 className="text-[14px] font-semibold text-dark m-0 truncate" title={s.name}>
                                                                {s.name || '—'}
                                                            </h4>
                                                            <p className="text-[12px] text-gray m-0 truncate" title={s.email}>
                                                                {s.email}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="min-w-[130px]">
                                                    {s.phone
                                                        ? <span className="text-[13px] text-dark whitespace-nowrap">{s.phone}</span>
                                                        : <span className="text-[12px] text-gray">—</span>}
                                                </td>
                                                <td className="min-w-[160px]">
                                                    {s.college
                                                        ? <span className="text-[13px] text-dark">{s.college}</span>
                                                        : <span className="text-[12px] text-gray">Not selected</span>}
                                                </td>
                                                <td className="min-w-[120px]">
                                                    {s.batch
                                                        ? <span className="text-[13px] text-dark">{s.batch}</span>
                                                        : <span className="text-[12px] text-gray">—</span>}
                                                </td>
                                                <td className="min-w-[180px]">
                                                    <EnrolledCoursesCell courses={s.enrolled_courses} />
                                                </td>
                                                <td className="min-w-[160px]">
                                                    {s.program_interested ? (
                                                        <span className="text-[13px]">{s.program_interested}</span>
                                                    ) : (
                                                        <span className="text-[12px] text-gray">Not selected</span>
                                                    )}
                                                </td>
                                                <td className="min-w-[160px]">
                                                    {s.pre_assessment ? (
                                                        <div>
                                                            <span
                                                                className={`text-[13px] font-semibold ${
                                                                    s.pre_assessment.passed
                                                                        ? 'text-green-600'
                                                                        : 'text-red-600'
                                                                }`}
                                                            >
                                                                Score: {s.pre_assessment.score}
                                                            </span>
                                                            <p className="text-[11px] text-gray m-0 mt-1">
                                                                Time taken: {fmtDuration(s.pre_assessment.duration_seconds)}
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[12px] text-gray">Not taken</span>
                                                    )}
                                                </td>
                                                <td className="min-w-[160px]">
                                                    {s.post_assessment ? (
                                                        <div>
                                                            <span
                                                                className={`text-[13px] font-semibold ${
                                                                    s.post_assessment.passed
                                                                        ? 'text-green-600'
                                                                        : 'text-red-600'
                                                                }`}
                                                            >
                                                                Score: {s.post_assessment.score}
                                                            </span>
                                                            <p className="text-[11px] text-gray m-0 mt-1">
                                                                Time taken: {fmtDuration(s.post_assessment.duration_seconds)}
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[12px] text-gray">Not taken</span>
                                                    )}
                                                </td>
                                                <td className="min-w-[200px]">
                                                    <CourseStatusCell courses={s.enrolled_courses} />
                                                </td>
                                                <td className="min-w-[140px]">
                                                    <CertificateStatusBadge cert={s.certificate} />
                                                </td>
                                                <td className="min-w-[260px]">
                                                    <ProgramRequestCell student={s} />
                                                </td>
                                                <td>
                                                    <RequestStatusBadge status={s.program_request_status} />
                                                </td>
                                                <td className="no-print">
                                                    <StudentOptions
                                                        student={s}
                                                        onDelete={() => setConfirm({ id: s.id, name: s.name })}
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {confirm && (
                <ConfirmDialog
                    title="Remove account"
                    message={`Are you sure you want to remove ${confirm.name}?`}
                    onCancel={() => setConfirm(null)}
                    onConfirm={() => handleDelete(confirm.id)}
                />
            )}

            {bulkOpen && (
                <Modal title="Bulk Program Request" onClose={() => setBulkOpen(false)} size="lg">
                    <BulkRequestForm
                        students={rows}
                        college={query.college}
                        batch={query.batch}
                        onDone={() => { setBulkOpen(false); load(); }}
                    />
                </Modal>
            )}
        </div>
    );
}

// Body of the Bulk Request modal. From / To are 1-based row positions in the
// current (college-filtered) student list; Send fires the program request to
// every student in that inclusive range, then refreshes the table via onDone.
function BulkRequestForm({ students = [], college, batch, onDone }) {
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [program, setProgram] = useState('');
    const [sending, setSending] = useState(false);

    // Programs linked by root admin to this (college, batch). Fetched once
    // when the modal opens; an empty array surfaces the "nothing to send"
    // hint and disables Send.
    const [programs, setPrograms] = useState([]);
    const [programsLoading, setProgramsLoading] = useState(false);
    useEffect(() => {
        if (!college || !batch) {
            setPrograms([]);
            return;
        }
        let alive = true;
        setProgramsLoading(true);
        listProgramsForCollegeBatch({ clgName: college, batchName: batch })
            .then((res) => { if (alive) setPrograms(res?.programs || []); })
            .catch(() => { if (alive) setPrograms([]); })
            .finally(() => { if (alive) setProgramsLoading(false); });
        return () => { alive = false; };
    }, [college, batch]);

    const total = students.length;
    const fromN = Number(from);
    const toN = Number(to);
    const rangeValid =
        from !== '' && to !== '' &&
        Number.isInteger(fromN) && Number.isInteger(toN) &&
        fromN >= 1 && toN >= fromN && toN <= total;
    const canSend = rangeValid && program !== '' && !sending && programs.length > 0;

    // Inclusive 1-based range → slice of the students array.
    const targets = rangeValid ? students.slice(fromN - 1, toN) : [];

    const handleSend = async () => {
        if (!canSend) return;
        setSending(true);
        let ok = 0;
        let failed = 0;
        // Sequential — keeps backend load predictable and lets one failure
        // not abort the rest.
        for (const s of targets) {
            try {
                await sendProgramRequest(s.id, program);
                ok += 1;
            } catch {
                failed += 1;
            }
        }
        setSending(false);
        if (ok > 0) {
            toast.success(
                `Program request sent to ${ok} student${ok > 1 ? 's' : ''}` +
                (failed ? ` (${failed} failed)` : '')
            );
        } else {
            toast.error('Failed to send program requests');
        }
        // Refresh the table so the Program Request / Request Status columns
        // reflect the new requests.
        onDone?.();
    };

    return (
        <div>
            <p className="text-[13px] text-gray mb-3">
                {college ? <>College: <span className="font-semibold text-dark">{college}</span> · </> : null}
                {batch ? <>Batch: <span className="font-semibold text-dark">{batch}</span> · </> : null}
                {total} student{total === 1 ? '' : 's'} listed. Enter a row range
                (1–{total}) and pick a program.
            </p>

            {/* 10-col grid: From / To take 2 each, Program 4, Send 2. */}
            <div className="grid grid-cols-1 sm:grid-cols-10 gap-3 items-end">
                <div className="sm:col-span-2">
                    <label className="ol-form-label">From</label>
                    <input
                        type="number"
                        min="1"
                        max={total}
                        className="ol-form-control"
                        placeholder="From"
                        value={from}
                        onChange={(e) => setFrom(e.target.value)}
                        disabled={sending}
                    />
                </div>
                <div className="sm:col-span-2">
                    <label className="ol-form-label">To</label>
                    <input
                        type="number"
                        min="1"
                        max={total}
                        className="ol-form-control"
                        placeholder="To"
                        value={to}
                        onChange={(e) => setTo(e.target.value)}
                        disabled={sending}
                    />
                </div>
                <div className="sm:col-span-4">
                    <label className="ol-form-label">Program</label>
                    <select
                        className="ol-form-control"
                        value={program}
                        onChange={(e) => setProgram(e.target.value)}
                        disabled={sending || programsLoading || programs.length === 0}
                    >
                        <option value="">
                            {programsLoading
                                ? 'Loading programs…'
                                : programs.length === 0
                                    ? 'No programs linked to this batch'
                                    : 'Select a program'}
                        </option>
                        {programs.map((p) => (
                            <option key={p.id} value={p.title}>{p.title}</option>
                        ))}
                    </select>
                </div>
                <div className="sm:col-span-2">
                    <button
                        type="button"
                        className="ol-btn-primary w-full"
                        disabled={!canSend}
                        onClick={handleSend}
                    >
                        {sending ? 'Sending…' : 'Send'}
                    </button>
                </div>
            </div>

            {/* Inline validation hint + selection preview. */}
            {!programsLoading && programs.length === 0 && (
                <p className="text-[12px] text-amber-700 mt-2">
                    No programs are linked to <strong>{college}</strong> /
                    <strong> {batch}</strong>. Link one in Manage Programs first.
                </p>
            )}
            {from !== '' && to !== '' && !rangeValid && (
                <p className="text-[12px] text-danger mt-2">
                    Enter a valid range between 1 and {total}, with “From” ≤ “To”.
                </p>
            )}
            {rangeValid && (
                <p className="text-[12px] text-gray mt-2">
                    This will send the request to {targets.length} student
                    {targets.length === 1 ? '' : 's'} (rows {fromN}–{toN}).
                </p>
            )}
        </div>
    );
}


// Enrolled courses chip strip. Shows up to two chips inline; the rest collapse
// into a "+N more" pill with a tooltip listing the overflow titles. Empty
// enrolment → small "None" placeholder so the column doesn't look broken.
function EnrolledCoursesCell({ courses }) {
    const rows = Array.isArray(courses) ? courses : [];
    if (rows.length === 0) {
        return <span className="text-[12px] text-gray">None</span>;
    }
    const MAX = 2;
    const visible = rows.slice(0, MAX);
    const hidden = rows.slice(MAX);
    return (
        <div className="flex flex-wrap items-center gap-1">
            {visible.map((c) => (
                <span
                    key={c.id}
                    className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[11px] max-w-[160px] truncate"
                    title={c.title}
                >
                    {c.title}
                </span>
            ))}
            {hidden.length > 0 && (
                <span
                    className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-[11px]"
                    title={hidden.map((h) => h.title).join(', ')}
                >
                    +{hidden.length} more
                </span>
            )}
        </div>
    );
}

// Per-course completion for the Course Status column. Lists each enrolled
// course with just its progress % (computed server-side from
// lesson_completions vs total lessons).
function CourseStatusCell({ courses }) {
    const rows = Array.isArray(courses) ? courses : [];
    if (rows.length === 0) {
        return <span className="text-[12px] text-gray">No courses</span>;
    }
    return (
        <div className="flex flex-wrap items-center gap-2">
            {rows.map((c) => (
                <span key={c.id} className="text-[13px] font-semibold text-skin">
                    {Number(c.progress_pct) || 0}%
                </span>
            ))}
        </div>
    );
}

// Certificate status pill — "Issued" (green) when at least one active
// certificate exists for the student, "Not issued" (gray) otherwise. Shows
// the per-student count when more than one, plus the latest issue date.
function CertificateStatusBadge({ cert }) {
    if (!cert || !cert.issued) {
        return (
            <span className="inline-block px-2 py-0.5 rounded text-[12px] font-semibold bg-gray-100 text-gray-600">
                Not issued
            </span>
        );
    }
    const issuedAt = cert.latest_issued_at
        ? new Date(cert.latest_issued_at).toLocaleDateString()
        : '';
    return (
        <div>
            <span className="inline-block px-2 py-0.5 rounded text-[12px] font-semibold bg-green-100 text-green-700">
                Issued{cert.count > 1 ? ` × ${cert.count}` : ''}
            </span>
            {issuedAt && (
                <p className="text-[11px] text-gray m-0 mt-1">{issuedAt}</p>
            )}
        </div>
    );
}

// Status of the program request an admin sent the student. Driven by
// program_requests.status (joined into the student list as
// program_request_status): sent → awaiting the student's response,
// accepted/rejected → the student responded.
function RequestStatusBadge({ status }) {
    if (!status) {
        return <span className="text-[12px] text-gray">No request</span>;
    }
    const map = {
        sent: { label: 'Pending', cls: 'bg-amber-100 text-amber-700' },
        accepted: { label: 'Accepted', cls: 'bg-green-100 text-green-700' },
        rejected: { label: 'Rejected', cls: 'bg-red-100 text-red-700' },
        cancelled: { label: 'Cancelled', cls: 'bg-gray-100 text-gray-600' },
    };
    const s = map[status] || { label: status, cls: 'bg-gray-100 text-gray-600' };
    return (
        <span className={`inline-block px-2 py-0.5 rounded text-[12px] font-semibold ${s.cls}`}>
            {s.label}
        </span>
    );
}

// Per-student Program Request: pick one of the three programs and Send.
// Prefills with the student's existing request (one-per-student upsert on
// the backend), so resending shows the current selection.
function ProgramRequestCell({ student }) {
    const [program, setProgram] = useState(student.program_request || '');
    const [sending, setSending] = useState(false);
    const [sentProgram, setSentProgram] = useState(student.program_request || '');

    // Programs linked by root admin to THIS student's (college, batch).
    // Fetched per-row because each student can sit in a different batch.
    // A row with no college or no batch shows an empty list — the admin
    // needs to assign the student first.
    const [programs, setPrograms] = useState([]);
    const [programsLoading, setProgramsLoading] = useState(false);
    useEffect(() => {
        if (!student.college || !student.batch) {
            setPrograms([]);
            return;
        }
        let alive = true;
        setProgramsLoading(true);
        listProgramsForCollegeBatch({
            clgName: student.college,
            batchName: student.batch,
        })
            .then((res) => { if (alive) setPrograms(res?.programs || []); })
            .catch(() => { if (alive) setPrograms([]); })
            .finally(() => { if (alive) setProgramsLoading(false); });
        return () => { alive = false; };
    }, [student.college, student.batch]);

    const onSend = async () => {
        if (!program || sending) return;
        setSending(true);
        try {
            await sendProgramRequest(student.id, program);
            setSentProgram(program);
            toast.success(`Program request sent to ${student.name}`);
        } catch (e) {
            toast.error(e.response?.data?.error || 'Failed to send program request');
        } finally {
            setSending(false);
        }
    };

    const noScope = !student.college || !student.batch;
    return (
        <div className="flex items-center gap-2">
            <select
                className="ol-form-control text-[13px] min-w-[170px]"
                value={program}
                onChange={(e) => setProgram(e.target.value)}
                disabled={sending || programsLoading || programs.length === 0}
                title={noScope ? 'Assign a college and batch first' : undefined}
            >
                <option value="">
                    {noScope
                        ? 'Needs college + batch'
                        : programsLoading
                            ? 'Loading…'
                            : programs.length === 0
                                ? 'No programs linked'
                                : 'Select program'}
                </option>
                {programs.map((p) => (
                    <option key={p.id} value={p.title}>{p.title}</option>
                ))}
            </select>
            <button
                type="button"
                className="ol-btn-primary text-[13px] px-3 py-1 disabled:opacity-50"
                onClick={onSend}
                disabled={!program || sending}
            >
                {sending ? 'Sending…' : 'Send'}
            </button>
            {sentProgram && !sending && (
                <span
                    className="text-[11px] text-green-600 whitespace-nowrap"
                    title={`Last sent: ${sentProgram}`}
                >
                    ✓ Sent
                </span>
            )}
        </div>
    );
}

// Searchable college dropdown: type to filter the list of colleges that
// students actually belong to; selecting one filters the table. The chosen
// value is driven by the parent (URL param) so it survives reload.
function CollegeFilter({ value, onChange }) {
    const [colleges, setColleges] = useState([]);
    const [open, setOpen] = useState(false);
    const [term, setTerm] = useState('');
    const boxRef = useRef(null);

    useEffect(() => {
        let alive = true;
        listStudentColleges()
            .then((res) => { if (alive) setColleges(res.colleges || []); })
            .catch(() => { /* dropdown just stays empty on failure */ });
        return () => { alive = false; };
    }, []);

    useEffect(() => {
        if (!open) return;
        const onDoc = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); };
        const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
        document.addEventListener('mousedown', onDoc);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onDoc);
            document.removeEventListener('keydown', onKey);
        };
    }, [open]);

    const filtered = term
        ? colleges.filter((c) => c.toLowerCase().includes(term.toLowerCase()))
        : colleges;

    const pick = (c) => {
        onChange(c);
        setTerm('');
        setOpen(false);
    };

    return (
        <div className="relative" ref={boxRef}>
            <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray pointer-events-none">
                    <i className="fi-rr-search" />
                </span>
                <input
                    className="ol-form-control w-full pl-9 pr-8"
                    type="text"
                    placeholder="Search college…"
                    value={open ? term : (value || '')}
                    onFocus={() => { setOpen(true); setTerm(''); }}
                    onChange={(e) => { setTerm(e.target.value); setOpen(true); }}
                />
                {(value || (open && term)) && (
                    <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray hover:text-danger font-bold px-1"
                        aria-label="Clear college filter"
                        onClick={() => { setTerm(''); onChange(''); setOpen(false); }}
                    >
                        ×
                    </button>
                )}
            </div>
            {open && (
                <ul className="absolute left-0 right-0 z-30 mt-1 max-h-64 overflow-auto bg-white border border-border rounded-ol-8 shadow-lg py-1 text-[13px]">
                    {term && (
                        <li className="px-3 py-1 text-[11px] text-gray border-b border-border">
                            {filtered.length} match{filtered.length === 1 ? '' : 'es'} for “{term}”
                        </li>
                    )}
                    <li>
                        <button
                            type="button"
                            className="w-full text-left px-3 py-2 text-gray hover:bg-gray-50"
                            onClick={() => pick('')}
                        >
                            All colleges
                        </button>
                    </li>
                    {filtered.length === 0 ? (
                        <li className="px-3 py-2 text-gray">No colleges match</li>
                    ) : (
                        filtered.map((c) => (
                            <li key={c}>
                                <button
                                    type="button"
                                    className={`w-full text-left px-3 py-2 hover:bg-gray-50 ${
                                        c === value ? 'text-skin font-semibold' : 'text-dark'
                                    }`}
                                    onClick={() => pick(c)}
                                >
                                    {c}
                                </button>
                            </li>
                        ))
                    )}
                </ul>
            )}
        </div>
    );
}

// Searchable batch dropdown sitting next to CollegeFilter. It's a no-op
// (greyed out) until a college is chosen — the spec is "enable after college
// is selected". The dropdown lists every batch belonging to that college via
// listBatchesByColleges([clgId]); the value is the batch NAME so it matches
// what the backend filter compares against (s.batch === requestedBatch).
function BatchFilter({ collegeName, value, onChange }) {
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [term, setTerm] = useState('');
    const boxRef = useRef(null);

    // Maintain a clgName -> clgId map so we can call listBatchesByColleges
    // (which takes ids) from a name picked in CollegeFilter (which returns
    // names). Cached once at mount — colleges don't change often.
    const [nameToClgId, setNameToClgId] = useState({});
    useEffect(() => {
        let alive = true;
        listColleges({ per_page: 1000 })
            .then((res) => {
                if (!alive) return;
                const map = {};
                (res.colleges || []).forEach((c) => { map[c.clgName] = c.clgId; });
                setNameToClgId(map);
            })
            .catch(() => { /* batch filter just shows "no batches" */ });
        return () => { alive = false; };
    }, []);

    // Re-fetch batches whenever the selected college changes. Empty college
    // → cleared list (and the input stays disabled, see render below).
    useEffect(() => {
        if (!collegeName) {
            setBatches([]);
            return;
        }
        const clgId = nameToClgId[collegeName];
        if (!clgId) {
            // The college might be a legacy free-text value with no row in
            // the colleges table; nothing to look up.
            setBatches([]);
            return;
        }
        let alive = true;
        setLoading(true);
        listBatchesByColleges([clgId])
            .then((res) => { if (alive) setBatches(res?.batches || []); })
            .catch(() => { if (alive) setBatches([]); })
            .finally(() => { if (alive) setLoading(false); });
        return () => { alive = false; };
    }, [collegeName, nameToClgId]);

    useEffect(() => {
        if (!open) return;
        const onDoc = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); };
        const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
        document.addEventListener('mousedown', onDoc);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onDoc);
            document.removeEventListener('keydown', onKey);
        };
    }, [open]);

    const filtered = term
        ? batches.filter((b) => (b.name || '').toLowerCase().includes(term.toLowerCase()))
        : batches;

    const pick = (name) => {
        onChange(name);
        setTerm('');
        setOpen(false);
    };

    const disabled = !collegeName;

    return (
        <div className="relative" ref={boxRef}>
            <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray pointer-events-none">
                    <i className="fi-rr-search" />
                </span>
                <input
                    className={`ol-form-control w-full pl-9 pr-8 ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    type="text"
                    placeholder={disabled ? 'Select college first…' : (loading ? 'Loading batches…' : 'Search batch…')}
                    value={open ? term : (value || '')}
                    onFocus={() => { if (!disabled) { setOpen(true); setTerm(''); } }}
                    onChange={(e) => { if (!disabled) { setTerm(e.target.value); setOpen(true); } }}
                    disabled={disabled}
                />
                {!disabled && (value || (open && term)) && (
                    <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray hover:text-danger font-bold px-1"
                        aria-label="Clear batch filter"
                        onClick={() => { setTerm(''); onChange(''); setOpen(false); }}
                    >
                        ×
                    </button>
                )}
            </div>
            {open && !disabled && (
                <ul className="absolute left-0 right-0 z-30 mt-1 max-h-64 overflow-auto bg-white border border-border rounded-ol-8 shadow-lg py-1 text-[13px]">
                    {term && (
                        <li className="px-3 py-1 text-[11px] text-gray border-b border-border">
                            {filtered.length} match{filtered.length === 1 ? '' : 'es'} for “{term}”
                        </li>
                    )}
                    <li>
                        <button
                            type="button"
                            className="w-full text-left px-3 py-2 text-gray hover:bg-gray-50"
                            onClick={() => pick('')}
                        >
                            All batches
                        </button>
                    </li>
                    {filtered.length === 0 ? (
                        <li className="px-3 py-2 text-gray">
                            {loading ? 'Loading…' : 'No batches for this college'}
                        </li>
                    ) : (
                        filtered.map((b) => (
                            <li key={b.id}>
                                <button
                                    type="button"
                                    className={`w-full text-left px-3 py-2 hover:bg-gray-50 ${
                                        b.name === value ? 'text-skin font-semibold' : 'text-dark'
                                    }`}
                                    onClick={() => pick(b.name)}
                                >
                                    {b.name}
                                </button>
                            </li>
                        ))
                    )}
                </ul>
            )}
        </div>
    );
}

function StudentOptions({ student, onDelete }) {
    const [open, setOpen] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const triggerRef = useRef(null);
    const menuRef = useRef(null);
    const MENU_WIDTH = 180;
    const ESTIMATED_MENU_HEIGHT = 110;

    useEffect(() => {
        if (!open) return;
        const el = triggerRef.current;
        if (el) {
            const rect = el.getBoundingClientRect();
            const GAP = 4;
            let left = rect.right - MENU_WIDTH;
            if (left < 8) left = 8;
            if (left + MENU_WIDTH > window.innerWidth - 8) left = window.innerWidth - MENU_WIDTH - 8;
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;
            let top;
            if (spaceBelow >= ESTIMATED_MENU_HEIGHT + GAP || spaceBelow >= spaceAbove) {
                top = rect.bottom + GAP;
            } else {
                top = rect.top - ESTIMATED_MENU_HEIGHT - GAP;
                if (top < 8) top = 8;
            }
            setCoords({ top, left });
        }
        const onDoc = (e) => {
            if (triggerRef.current?.contains(e.target)) return;
            if (menuRef.current?.contains(e.target)) return;
            setOpen(false);
        };
        const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
        const onScroll = () => setOpen(false);
        const onResize = () => setOpen(false);
        window.addEventListener('scroll', onScroll, true);
        window.addEventListener('resize', onResize);
        document.addEventListener('mousedown', onDoc);
        document.addEventListener('keydown', onKey);
        return () => {
            window.removeEventListener('scroll', onScroll, true);
            window.removeEventListener('resize', onResize);
            document.removeEventListener('mousedown', onDoc);
            document.removeEventListener('keydown', onKey);
        };
    }, [open]);

    const close = () => setOpen(false);

    return (
        <div className="relative inline-block">
            <button
                ref={triggerRef}
                type="button"
                className="inline-flex items-center justify-center w-8 h-8 rounded-ol-8 border border-border text-gray hover:border-skin hover:text-skin"
                onClick={() => setOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={open}
            >
                <BsThreeDotsVertical className="text-[16px]" />
            </button>
            {open && createPortal(
                <ul
                    ref={menuRef}
                    role="menu"
                    style={{ position: 'fixed', top: coords.top, left: coords.left, width: MENU_WIDTH }}
                    className="z-[1000] bg-white border border-border rounded-ol-8 shadow-lg py-1 text-[13px]"
                >
                    <li>
                        <Link
                            to={`/admin/students/edit/${student.id}`}
                            className="block px-3 py-2 text-dark hover:bg-gray-50"
                            onClick={close}
                        >
                            Edit
                        </Link>
                    </li>
                    <li>
                        <button
                            type="button"
                            className="w-full text-left block px-3 py-2 text-danger hover:bg-gray-50"
                            onClick={() => { close(); onDelete(); }}
                        >
                            Remove account
                        </button>
                    </li>
                </ul>,
                document.body,
            )}
        </div>
    );
}

function ExportDropdown({ onPdf, onPrint }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        if (!open) return;
        const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
        document.addEventListener('mousedown', onDoc);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onDoc);
            document.removeEventListener('keydown', onKey);
        };
    }, [open]);

    return (
        <div className="relative inline-block" ref={ref}>
            <button
                type="button"
                className="ol-btn-light inline-flex items-center gap-2"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
            >
                Export
                <i className="fi-rr-file-export" />
            </button>
            {open && (
                <ul className="absolute left-0 z-20 mt-1 min-w-[160px] bg-white border border-border rounded-ol-8 shadow-lg py-1 text-[13px]">
                    <li>
                        <button
                            type="button"
                            className="w-full text-left flex items-center gap-2 px-3 py-2 text-dark hover:bg-gray-50"
                            onClick={() => { setOpen(false); onPdf(); }}
                        >
                            <i className="fi-rr-file-pdf" /> PDF
                        </button>
                    </li>
                    <li>
                        <button
                            type="button"
                            className="w-full text-left flex items-center gap-2 px-3 py-2 text-dark hover:bg-gray-50"
                            onClick={() => { setOpen(false); onPrint(); }}
                        >
                            <i className="fi-rr-print" /> Print
                        </button>
                    </li>
                </ul>
            )}
        </div>
    );
}
