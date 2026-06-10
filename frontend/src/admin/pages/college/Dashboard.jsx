import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getCollegeStats, getCollegeCourses, getCollegePrograms, getStudentRequests, approveStudentRequest, rejectStudentRequest } from '../../api/collegeDashboard';
import { toast } from 'react-toastify';
import { listStudents } from '../../api/student';
import { getStoredUser } from '../../api/auth';
import BatchForm from './BatchForm';
import ManageBatches from './ManageBatches';
import ExportMenu from '../../components/ExportMenu';

const API = import.meta.env.VITE_ADMIN_API_URL || 'http://localhost:4000';

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

// ---- Export (PDF + CSV) for the college dashboard's students table ----
// Plain-string extractors (no JSX) shared by the clean print table and the CSV.
// Same fields as Manage Students minus College (implied by the dashboard).
const fmtAssessment = (a) =>
    a ? `${a.passed ? 'Pass' : 'Fail'} · Score ${a.score} · ${fmtDuration(a.duration_seconds)}` : 'Not taken';
const fmtCert = (c) => {
    if (!c || !c.issued) return 'Not issued';
    const date = c.latest_issued_at ? new Date(c.latest_issued_at).toLocaleDateString() : '';
    return `Issued${c.count > 1 ? ` ×${c.count}` : ''}${date ? ` (${date})` : ''}`;
};
const fmtCourseStatus = (courses) => {
    const rows = Array.isArray(courses) ? courses : [];
    if (!rows.length) return 'No courses';
    return rows.map((c) => `${c.title}: ${Number(c.progress_pct) || 0}%`).join('; ');
};
const REQUEST_STATUS_LABELS = {
    sent: 'Pending', accepted: 'Accepted', rejected: 'Rejected', cancelled: 'Cancelled',
};
const STUDENT_EXPORT_COLUMNS = [
    { header: 'Name', value: (s) => s.name || '' },
    { header: 'Email', value: (s) => s.email || '' },
    { header: 'Phone', value: (s) => s.phone || '' },
    { header: 'Batch', value: (s) => s.batch || '' },
    { header: 'Enrolled Courses', value: (s) => (Array.isArray(s.enrolled_courses) && s.enrolled_courses.length ? s.enrolled_courses.map((c) => c.title).join('; ') : 'None') },
    { header: 'Program Interested', value: (s) => s.program_interested || 'Not selected' },
    { header: 'Pre-Assessment', value: (s) => fmtAssessment(s.pre_assessment) },
    { header: 'Post-Assessment', value: (s) => fmtAssessment(s.post_assessment) },
    { header: 'Course Status', value: (s) => fmtCourseStatus(s.enrolled_courses) },
    { header: 'Certificate Status', value: (s) => fmtCert(s.certificate) },
    { header: 'Program Sent', value: (s) => s.program_request || '' },
    { header: 'Request Status', value: (s) => REQUEST_STATUS_LABELS[s.program_request_status] || (s.program_request_status || 'No request') },
];
const downloadStudentsCsv = (students, collegeName) => {
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const header = ['#', ...STUDENT_EXPORT_COLUMNS.map((c) => c.header)];
    const lines = [header.map(esc).join(',')];
    students.forEach((s, i) => {
        lines.push([esc(i + 1), ...STUDENT_EXPORT_COLUMNS.map((c) => esc(c.value(s)))].join(','));
    });
    const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const slug = (collegeName || 'college').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
    a.download = `students-${slug}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

/**
 * College Dashboard — landing page for college admins.
 *
 * Layout: a tab strip lets the admin switch between the original KPI cards
 * and the new Add / Manage Batches tools without leaving /admin/college.
 * Tab state is mirrored to the URL via ?tab= so a refresh stays put and
 * the back button works.
 *
 * Live data: GET /api/admin/college-dashboard/stats (admin-service:4000).
 */
// Which tab is showing is driven by ?tab= in the URL — the sidebar's
// Batches dropdown deep-links here with these keys. The header tab strip
// was removed at the admin's request; the sidebar is now the only nav.
const VALID_TABS = ['dashboard', 'add-batch', 'manage-batches', 'assigned-courses', 'assigned-programs', 'student-requests'];

export default function CollegeDashboardPage() {
    const [params, setParams] = useSearchParams();
    const initialTab = VALID_TABS.includes(params.get('tab'))
        ? params.get('tab')
        : 'dashboard';
    const [tab, setTab] = useState(initialTab);

    useEffect(() => {
        const fromUrl = VALID_TABS.includes(params.get('tab'))
            ? params.get('tab')
            : 'dashboard';
        if (fromUrl !== tab) setTab(fromUrl);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params]);

    const switchTab = (key) => {
        setTab(key);
        const next = new URLSearchParams(params);
        if (key === 'dashboard') next.delete('tab');
        else next.set('tab', key);
        setParams(next, { replace: true });
    };

    // Creating a new batch on the Add Batch tab should refresh the Manage
    // Batches list the next time the admin visits it — bump this counter so
    // ManageBatches.load() re-fires on its next mount.
    const [batchesRefreshKey, setBatchesRefreshKey] = useState(0);

    return (
        <div>
            {tab === 'dashboard' && <DashboardKpis />}
            {tab === 'add-batch' && (
                <BatchForm
                    onCreated={() => {
                        setBatchesRefreshKey((k) => k + 1);
                        switchTab('manage-batches');
                    }}
                />
            )}
            {tab === 'manage-batches' && <ManageBatches refreshKey={batchesRefreshKey} />}
            {tab === 'assigned-courses' && <AssignedCoursesTable />}
            {tab === 'assigned-programs' && <AssignedProgramsTable />}
            {tab === 'student-requests' && <StudentRequestsTable />}
        </div>
    );
}

// ── Original KPI view, extracted so the tab shell can mount/unmount it ──────
const CARDS = [
    { key: 'total_students',           label: 'Enrolled Students' },
    { key: 'pre_assessment_attempts',  label: 'Pre-Assessment Attempts' },
    { key: 'active_learners',          label: 'Active Learners' },
    { key: 'post_assessment_attempts', label: 'Post-Assessment Attempts' },
    { key: 'certified_graduates',      label: 'Certified Graduates' },
];

const StatCard = ({ count, label }) => (
    <div className="ol-card card-hover">
        <div className="ol-card-body px-5 py-3">
            <p className="text-[18px] text-dark font-semibold my-2">{count}</p>
            <p className="text-[14px] text-gray">{label}</p>
        </div>
    </div>
);

function DashboardKpis() {
    const adminUser = getStoredUser();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const load = useCallback(async ({ signal } = {}) => {
        setLoading(true);
        setError(null);
        try {
            const data = await getCollegeStats();
            if (signal?.aborted) return;
            setStats(data);
        } catch (err) {
            if (signal?.aborted) return;
            const status = err?.response?.status;
            const message = err?.response?.data?.error || err?.message || 'Failed to load dashboard';
            setError(status ? `${status} — ${message}` : message);
            setStats(null);
        } finally {
            if (!signal?.aborted) setLoading(false);
        }
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        load({ signal: controller.signal });
        return () => controller.abort();
    }, [load]);

    const collegeIdLabel = stats?.college_id || adminUser?.college_id;

    if (loading && !stats) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-gray">
                <div className="w-10 h-10 border-4 border-gray-200 border-t-skin rounded-full animate-spin mb-3" />
                <p className="text-[14px]">Loading dashboard…</p>
            </div>
        );
    }

    if (error && !stats) {
        return (
            <div className="ol-card rounded-ol-8">
                <div className="ol-card-body py-10 px-6 text-center">
                    <p className="text-[16px] font-semibold text-danger mb-2">Couldn’t load dashboard</p>
                    <p className="text-[13px] text-gray mb-4">{error}</p>
                    <button className="ol-btn-primary" onClick={() => load()}>Retry</button>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="ol-card">
                <div className="ol-card-body px-5 my-3 py-4">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <h4 className="text-[16px] font-semibold text-dark m-0">College Dashboard</h4>
                        <div className="flex items-center gap-3">
                            {collegeIdLabel && (
                                <span className="text-[13px] text-gray">College: {collegeIdLabel}</span>
                            )}
                            <button
                                type="button"
                                onClick={() => load()}
                                disabled={loading}
                                className="ol-btn-outline-secondary text-[13px] px-3 py-1 disabled:opacity-50"
                            >
                                {loading ? 'Refreshing…' : 'Refresh'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {error && (
                <div className="ol-card rounded-ol-8 mb-3 border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-[13px]">
                    <strong>Couldn't refresh dashboard:</strong> {error}
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3 my-3">
                {CARDS.map((card) => (
                    <StatCard
                        key={card.key}
                        count={stats?.[card.key] ?? 0}
                        label={card.label}
                    />
                ))}
            </div>

            <CollegeStudentsTable collegeName={stats?.college_name} />
        </div>
    );
}

function CollegeStudentsTable({ collegeName }) {
    const [rows, setRows] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!collegeName) {
            setRows([]);
            setTotal(0);
            setLoading(false);
            return;
        }
        let alive = true;
        setLoading(true);
        setError(null);
        listStudents({ per_page: 1000, college: collegeName })
            .then((res) => {
                if (!alive) return;
                setRows(res.students || []);
                setTotal(res.total ?? (res.students || []).length);
            })
            .catch((err) => {
                if (!alive) return;
                setError(err?.response?.data?.error || err?.message || 'Failed to load students');
            })
            .finally(() => { if (alive) setLoading(false); });
        return () => { alive = false; };
    }, [collegeName]);

    if (!collegeName) return null;

    return (
        <div className="ol-card p-3 min-w-0 mt-3">
            <div className="ol-card-body min-w-0">
                <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
                    <h4 className="text-[16px] font-semibold text-dark m-0">Students</h4>
                    <div className="flex items-center gap-3">
                        <p className="text-gray text-[13px] m-0">
                            {loading ? 'Loading…' : `${rows.length} of ${total}`}
                        </p>
                        {rows.length > 0 && (
                            <ExportMenu
                                align="right"
                                onPdf={() => window.print()}
                                onPrint={() => window.print()}
                                onCsv={() => downloadStudentsCsv(rows, collegeName)}
                            />
                        )}
                    </div>
                </div>

                {error ? (
                    <div className="py-6 text-center text-[13px] text-danger">{error}</div>
                ) : loading ? (
                    <div className="py-10 text-center text-[13px] text-gray">Loading students…</div>
                ) : rows.length === 0 ? (
                    <div className="py-10 text-center border border-dashed border-border rounded-ol-8">
                        <p className="text-[14px] text-gray m-0">No students found for this college.</p>
                    </div>
                ) : (
                  <>
                    <div className="w-full max-w-full min-w-0 overflow-x-auto print:hidden">
                        <table className="e-table">
                            <thead>
                                <tr>
                                    <th scope="col">#</th>
                                    <th scope="col">Name</th>
                                    <th scope="col">Phone</th>
                                    <th scope="col">Batch</th>
                                    <th scope="col">Enrolled Courses</th>
                                    <th scope="col">Program Interested</th>
                                    <th scope="col">Pre-Assessment</th>
                                    <th scope="col">Post-Assessment</th>
                                    <th scope="col">Course Status</th>
                                    <th scope="col">Certificate Status</th>
                                    <th scope="col">Program Sent</th>
                                    <th scope="col">Request Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((s, i) => (
                                    <tr key={s.id}>
                                        <td>{i + 1}</td>
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
                                                            s.pre_assessment.passed ? 'text-green-600' : 'text-red-600'
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
                                                            s.post_assessment.passed ? 'text-green-600' : 'text-red-600'
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
                                            {s.certificate?.issued ? (
                                                <span className="inline-block px-2 py-0.5 rounded text-[12px] font-semibold bg-green-100 text-green-700">
                                                    Issued{s.certificate.count > 1 ? ` × ${s.certificate.count}` : ''}
                                                </span>
                                            ) : (
                                                <span className="inline-block px-2 py-0.5 rounded text-[12px] font-semibold bg-gray-100 text-gray-600">
                                                    Not issued
                                                </span>
                                            )}
                                        </td>
                                        <td className="min-w-[170px]">
                                            {s.program_request ? (
                                                <span className="text-[13px]">{s.program_request}</span>
                                            ) : (
                                                <span className="text-[12px] text-gray">—</span>
                                            )}
                                        </td>
                                        <td>
                                            <ReqStatus status={s.program_request_status} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Clean print-only table — plain text, no avatars/badges —
                        so the PDF reads well. Hidden on screen; shown only when
                        printing (the @media print rules reveal print-area). */}
                    <div className="hidden print:block print-area">
                        <table className="e-table print-compact">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    {STUDENT_EXPORT_COLUMNS.map((c) => (
                                        <th key={c.header}>{c.header}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((s, i) => (
                                    <tr key={s.id}>
                                        <td>{i + 1}</td>
                                        {STUDENT_EXPORT_COLUMNS.map((c) => (
                                            <td key={c.header}>{c.value(s)}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                  </>
                )}
            </div>
        </div>
    );
}

// ── Assigned Courses tab ───────────────────────────────────────────────────
// Read-only list of courses the root admin assigned to this college
// (courses.clg_ids contains the admin's college_id, resolved server-side from
// the JWT). Columns: Title, Status, Lessons, Enrolled (this college's students).
const COURSE_STATUS_CLS = {
    active: 'bg-green-100 text-green-700',
    inactive: 'bg-gray-200 text-gray-700',
    pending: 'bg-yellow-100 text-yellow-700',
    upcoming: 'bg-blue-100 text-blue-700',
    draft: 'bg-slate-200 text-slate-700',
    private: 'bg-purple-100 text-purple-700',
};
function CourseStatusBadge({ status }) {
    if (!status) return <span className="text-[11px] text-muted">—</span>;
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${COURSE_STATUS_CLS[status] || 'bg-gray-100 text-gray-700'}`}>
            {status}
        </span>
    );
}

const downloadCoursesCsv = (courses) => {
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const header = ['#', 'Course Title', 'Status', 'Batches', 'Lessons', 'Enrolled'];
    const lines = [header.map(esc).join(',')];
    courses.forEach((c, i) => {
        const batches = Array.isArray(c.batches) && c.batches.length ? c.batches.join('; ') : 'None';
        lines.push([esc(i + 1), esc(c.title), esc(c.status), esc(batches), esc(c.lesson_count), esc(c.enrolled)].join(','));
    });
    const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `assigned-courses-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

function AssignedCoursesTable() {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getCollegeCourses();
            setRows(Array.isArray(data?.courses) ? data.courses : []);
        } catch (err) {
            const status = err?.response?.status;
            const message = err?.response?.data?.error || err?.message || 'Failed to load courses';
            setError(status ? `${status} — ${message}` : message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    return (
        <div className="ol-card rounded-ol-8">
            <div className="ol-card-body py-12px px-20px my-3">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <h4 className="text-[16px] font-semibold text-dark m-0 flex items-center gap-2">
                        <i className="fi-rr-book-alt" />
                        Assigned Courses{' '}
                        <span className="text-muted font-normal">({rows.length})</span>
                    </h4>
                    <div className="flex items-center gap-2">
                        {rows.length > 0 && (
                            <ExportMenu
                                align="right"
                                onPdf={() => window.print()}
                                onPrint={() => window.print()}
                                onCsv={() => downloadCoursesCsv(rows)}
                            />
                        )}
                        <button
                            type="button"
                            className="ol-btn-outline-secondary text-[13px] px-3 py-1 disabled:opacity-50"
                            onClick={load}
                            disabled={loading}
                        >
                            {loading ? 'Refreshing…' : 'Refresh'}
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="py-10 text-center text-[13px] text-gray">Loading courses…</div>
                ) : error ? (
                    <div className="py-10 text-center">
                        <p className="text-[14px] text-danger mb-3">{error}</p>
                        <button className="ol-btn-primary" onClick={load}>Retry</button>
                    </div>
                ) : rows.length === 0 ? (
                    <div className="py-10 text-center border border-dashed border-border rounded-ol-8 mt-3">
                        <p className="text-[14px] text-gray m-0">
                            No courses have been assigned to your college yet.
                        </p>
                    </div>
                ) : (
                    <div className="w-full max-w-full min-w-0 overflow-x-auto mt-3 print-area">
                        <table className="e-table w-full">
                            <thead>
                                <tr>
                                    <th className="w-[60px]">#</th>
                                    <th>Course Title</th>
                                    <th className="w-[120px]">Status</th>
                                    <th>Batches</th>
                                    <th className="w-[100px]">Lessons</th>
                                    <th className="w-[110px]">Enrolled</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((c, i) => (
                                    <tr key={c.id}>
                                        <td>{i + 1}</td>
                                        <td className="font-semibold text-dark">{c.title}</td>
                                        <td><CourseStatusBadge status={c.status} /></td>
                                        <td>
                                            {Array.isArray(c.batches) && c.batches.length ? (
                                                <div className="flex flex-wrap gap-1">
                                                    {c.batches.map((b) => (
                                                        <span key={b} className="inline-flex items-center px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[11px]">
                                                            {b}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-[11px] text-muted">No batches</span>
                                            )}
                                        </td>
                                        <td>{c.lesson_count ?? 0}</td>
                                        <td>{c.enrolled ?? 0}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Student Requests tab ───────────────────────────────────────────────────
// Students who signed up for this college and are awaiting approval
// (auth users.profileStatus = 'pending'). The admin reviews their signup
// details and approves (-> profileStatus 'active').
function StudentRequestsTable() {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [approvingId, setApprovingId] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getStudentRequests();
            setRows(Array.isArray(data?.requests) ? data.requests : []);
        } catch (err) {
            const status = err?.response?.status;
            const message = err?.response?.data?.error || err?.message || 'Failed to load requests';
            setError(status ? `${status} — ${message}` : message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const approve = async (userId, name) => {
        setApprovingId(userId);
        try {
            await approveStudentRequest(userId);
            toast.success(`Approved ${name || 'student'}`);
            // Remove from the pending list.
            setRows((prev) => prev.filter((r) => r.userId !== userId));
        } catch (err) {
            toast.error(err?.response?.data?.error || 'Failed to approve');
        } finally {
            setApprovingId(null);
        }
    };

    const reject = async (userId, name) => {
        setApprovingId(userId);
        try {
            await rejectStudentRequest(userId);
            toast.success(`Rejected ${name || 'student'}`);
            setRows((prev) => prev.filter((r) => r.userId !== userId));
        } catch (err) {
            toast.error(err?.response?.data?.error || 'Failed to reject');
        } finally {
            setApprovingId(null);
        }
    };

    return (
        <div className="ol-card rounded-ol-8">
            <div className="ol-card-body py-12px px-20px my-3">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <h4 className="text-[16px] font-semibold text-dark m-0 flex items-center gap-2">
                        <i className="fi-rr-user-add" />
                        Student Requests{' '}
                        <span className="text-muted font-normal">({rows.length})</span>
                    </h4>
                    <button
                        type="button"
                        className="ol-btn-outline-secondary text-[13px] px-3 py-1 disabled:opacity-50"
                        onClick={load}
                        disabled={loading}
                    >
                        {loading ? 'Refreshing…' : 'Refresh'}
                    </button>
                </div>

                {loading ? (
                    <div className="py-10 text-center text-[13px] text-gray">Loading requests…</div>
                ) : error ? (
                    <div className="py-10 text-center">
                        <p className="text-[14px] text-danger mb-3">{error}</p>
                        <button className="ol-btn-primary" onClick={load}>Retry</button>
                    </div>
                ) : rows.length === 0 ? (
                    <div className="py-10 text-center border border-dashed border-border rounded-ol-8 mt-3">
                        <p className="text-[14px] text-gray m-0">No pending student requests.</p>
                    </div>
                ) : (
                    <div className="w-full max-w-full min-w-0 overflow-x-auto mt-3">
                        <table className="e-table w-full">
                            <thead>
                                <tr>
                                    <th className="w-[60px]">#</th>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Phone</th>
                                    <th>Branch</th>
                                    <th>Education</th>
                                    <th>Grad. Year</th>
                                    <th>Requested</th>
                                    <th className="w-[120px]">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((s, i) => (
                                    <tr key={s.userId}>
                                        <td>{i + 1}</td>
                                        <td className="font-semibold text-dark">{s.name || '—'}</td>
                                        <td>{s.email || '—'}</td>
                                        <td>{s.phone || '—'}</td>
                                        <td>{s.branch || '—'}</td>
                                        <td>{s.educationLevel || '—'}</td>
                                        <td>{s.graduationYear || '—'}</td>
                                        <td className="text-[12px] text-gray">
                                            {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : '—'}
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    className="ol-btn-primary text-[12px] px-3 py-1 disabled:opacity-50"
                                                    onClick={() => approve(s.userId, s.name)}
                                                    disabled={approvingId === s.userId}
                                                >
                                                    {approvingId === s.userId ? 'Approving…' : 'Approve'}
                                                </button>
                                                <button
                                                    type="button"
                                                    className="text-[12px] px-3 py-1 rounded border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50"
                                                    onClick={() => reject(s.userId, s.name)}
                                                    disabled={approvingId === s.userId}
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Assigned Programs tab ──────────────────────────────────────────────────
// Read-only list of programs the root admin assigned to this college
// (programs.clg_ids contains the college_id). Columns: Title, Status, Courses
// (bundled course names), Batches, Enrolled (this college's students).
const downloadProgramsCsv = (programs) => {
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const header = ['#', 'Program Title', 'Status', 'Courses', 'Batches', 'Enrolled'];
    const lines = [header.map(esc).join(',')];
    programs.forEach((p, i) => {
        const courses = Array.isArray(p.courses) && p.courses.length ? p.courses.join('; ') : 'None';
        const batches = Array.isArray(p.batches) && p.batches.length ? p.batches.join('; ') : 'None';
        lines.push([esc(i + 1), esc(p.title), esc(p.status), esc(courses), esc(batches), esc(p.enrolled)].join(','));
    });
    const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `assigned-programs-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

const Chips = ({ items, empty, cls }) => (
    Array.isArray(items) && items.length ? (
        <div className="flex flex-wrap gap-1">
            {items.map((x) => (
                <span key={x} className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] ${cls}`}>{x}</span>
            ))}
        </div>
    ) : (
        <span className="text-[11px] text-muted">{empty}</span>
    )
);

function AssignedProgramsTable() {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getCollegePrograms();
            setRows(Array.isArray(data?.programs) ? data.programs : []);
        } catch (err) {
            const status = err?.response?.status;
            const message = err?.response?.data?.error || err?.message || 'Failed to load programs';
            setError(status ? `${status} — ${message}` : message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    return (
        <div className="ol-card rounded-ol-8">
            <div className="ol-card-body py-12px px-20px my-3">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <h4 className="text-[16px] font-semibold text-dark m-0 flex items-center gap-2">
                        <i className="fi-rr-graduation-cap" />
                        Assigned Programs{' '}
                        <span className="text-muted font-normal">({rows.length})</span>
                    </h4>
                    <div className="flex items-center gap-2">
                        {rows.length > 0 && (
                            <ExportMenu
                                align="right"
                                onPdf={() => window.print()}
                                onPrint={() => window.print()}
                                onCsv={() => downloadProgramsCsv(rows)}
                            />
                        )}
                        <button
                            type="button"
                            className="ol-btn-outline-secondary text-[13px] px-3 py-1 disabled:opacity-50"
                            onClick={load}
                            disabled={loading}
                        >
                            {loading ? 'Refreshing…' : 'Refresh'}
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="py-10 text-center text-[13px] text-gray">Loading programs…</div>
                ) : error ? (
                    <div className="py-10 text-center">
                        <p className="text-[14px] text-danger mb-3">{error}</p>
                        <button className="ol-btn-primary" onClick={load}>Retry</button>
                    </div>
                ) : rows.length === 0 ? (
                    <div className="py-10 text-center border border-dashed border-border rounded-ol-8 mt-3">
                        <p className="text-[14px] text-gray m-0">
                            No programs have been assigned to your college yet.
                        </p>
                    </div>
                ) : (
                    <div className="w-full max-w-full min-w-0 overflow-x-auto mt-3 print-area">
                        <table className="e-table w-full">
                            <thead>
                                <tr>
                                    <th className="w-[60px]">#</th>
                                    <th>Program Title</th>
                                    <th className="w-[120px]">Status</th>
                                    <th>Courses</th>
                                    <th>Batches</th>
                                    <th className="w-[110px]">Enrolled</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((p, i) => (
                                    <tr key={p.id}>
                                        <td>{i + 1}</td>
                                        <td className="font-semibold text-dark">{p.title}</td>
                                        <td><CourseStatusBadge status={p.status} /></td>
                                        <td><Chips items={p.courses} empty="No courses" cls="bg-emerald-50 text-emerald-700" /></td>
                                        <td><Chips items={p.batches} empty="No batches" cls="bg-indigo-50 text-indigo-700" /></td>
                                        <td>{p.enrolled ?? 0}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

// Compact chip list of the student's enrolled courses, capped so the cell
// stays narrow. Mirrors the root-admin students table cell. `courses` is the
// enrolled_courses array from listStudents ({ id, title }).
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
                    title={hidden.map((c) => c.title).join(', ')}
                >
                    +{hidden.length}
                </span>
            )}
        </div>
    );
}

// Per-course completion for the Course Status column. Lists each enrolled
// course with just its progress % (computed server-side from
// lesson_completions vs total lessons). Mirrors the root-admin table cell.
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

function ReqStatus({ status }) {
    if (!status) return <span className="text-[12px] text-gray">No request</span>;
    const map = {
        sent:      { label: 'Pending',   cls: 'bg-amber-100 text-amber-700' },
        accepted:  { label: 'Accepted',  cls: 'bg-green-100 text-green-700' },
        rejected:  { label: 'Rejected',  cls: 'bg-red-100 text-red-700' },
        cancelled: { label: 'Cancelled', cls: 'bg-gray-100 text-gray-600' },
    };
    const s = map[status] || { label: status, cls: 'bg-gray-100 text-gray-600' };
    return (
        <span className={`inline-block px-2 py-0.5 rounded text-[12px] font-semibold ${s.cls}`}>
            {s.label}
        </span>
    );
}
