import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getCollegeStats } from '../../api/collegeDashboard';
import { listStudents } from '../../api/student';
import { getStoredUser } from '../../api/auth';
import BatchForm from './BatchForm';
import ManageBatches from './ManageBatches';

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
const VALID_TABS = ['dashboard', 'add-batch', 'manage-batches'];

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
                    <p className="text-gray text-[13px] m-0">
                        {loading ? 'Loading…' : `${rows.length} of ${total}`}
                    </p>
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
                    <div className="w-full max-w-full min-w-0 overflow-x-auto">
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
