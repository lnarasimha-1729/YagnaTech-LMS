import { useCallback, useEffect, useState } from 'react';
import { getCollegeStats } from '../../api/collegeDashboard';
import { getStoredUser } from '../../api/auth';

/**
 * College Dashboard — landing page for college admins. Shows five KPI cards
 * scoped to the admin's own college (the backend reads college_id from the JWT).
 *
 * Visual shell mirrors admin/pages/dashboard/Index.jsx so the chrome (header
 * card, StatCard typography, spacing) is identical to the rest of the admin.
 *
 * Live data: GET /api/admin/college-dashboard/stats (admin-service:4000).
 * Response shape:
 *   {
 *     college_id, total_students, pre_assessment_attempts,
 *     active_learners, post_assessment_attempts, certified_graduates
 *   }
 */
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

export default function CollegeDashboardPage() {
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

    // First-load spinner / error block — same pattern as admin/pages/course/Index.jsx
    // and admin/pages/dashboard/Index.jsx so all admin pages have consistent
    // loading and error chrome.
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

            {/* Inline error banner — only shown on subsequent refresh failures
                (the first-load failure is handled by the full-page error block above). */}
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
        </div>
    );
}
