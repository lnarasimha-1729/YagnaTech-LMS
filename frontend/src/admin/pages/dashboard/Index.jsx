import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardStats } from '../../api/admin';

const StatCard = ({ count, label }) => (
    <div className="ol-card card-hover">
        <div className="ol-card-body px-5 py-3">
            <p className="text-[18px] text-dark font-semibold my-2">{count}</p>
            <p className="text-[14px] text-gray">{label}</p>
        </div>
    </div>
);

const StatusLegend = ({ label, color }) => (
    <li className="flex items-center gap-2 mb-1">
        <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: color }}></span>
        <span className="text-[14px] text-dark">{label}</span>
    </li>
);

export default function Dashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Pulled out of useEffect so the error-state Retry button can call it too.
    // Mirrors the load() pattern in admin/pages/course/Index.jsx for consistency.
    const load = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await dashboardStats();
            setData(res);
        } catch (err) {
            setError(err?.response?.data?.error || err?.message || 'Failed to load dashboard');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    // First-load spinner — same shape as Manage Courses so the admin chrome
    // stays consistent across pages.
    if (loading && !data) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-gray">
                <div className="w-10 h-10 border-4 border-gray-200 border-t-skin rounded-full animate-spin mb-3" />
                <p className="text-[14px]">Loading dashboard…</p>
            </div>
        );
    }

    if (error && !data) {
        return (
            <div className="ol-card rounded-ol-8">
                <div className="ol-card-body py-10 px-6 text-center">
                    <p className="text-[16px] font-semibold text-danger mb-2">Couldn’t load dashboard</p>
                    <p className="text-[13px] text-gray mb-4">{error}</p>
                    <button className="ol-btn-primary" onClick={load}>Retry</button>
                </div>
            </div>
        );
    }

    const { stats = {}, status_counts = {} } = data;
    const statusItems = [
        { key: 'active', label: 'Active', color: '#12c093' },
        { key: 'upcoming', label: 'Upcoming', color: '#169f48' },
        { key: 'pending', label: 'Pending', color: '#ff2583' },
        { key: 'private', label: 'Private', color: '#000000' },
        { key: 'draft', label: 'Draft', color: '#878d97' },
        { key: 'inactive', label: 'Inactive', color: '#dadada' },
    ];
    const totalStatus = statusItems.reduce((s, i) => s + (status_counts[i.key] || 0), 0) || 1;

    return (
        <div>
            <div className="ol-card">
                <div className="ol-card-body px-5 my-3 py-4">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <h4 className="text-[16px] font-semibold text-dark">Dashboard</h4>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 my-3 items-stretch">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                    <StatCard count={stats.course_count || 0} label="Number of Courses" />
                    <StatCard count={stats.lesson_count || 0} label="Number of Lessons" />
                    <StatCard count={stats.enrollment_count || 0} label="Number of Enrollment" />
                    <StatCard count={stats.student_count || 0} label="Number of Students" />
                </div>

                <div className="ol-card h-full">
                    <div className="ol-card-body p-3">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-[14px] font-semibold text-dark">Course Status</h4>
                            <Link to="/admin/courses" className="text-skin text-[12px]">Explore</Link>
                        </div>
                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="w-[140px] h-[140px] rounded-full flex-shrink-0" style={{
                                background: `conic-gradient(${statusItems.map((i, idx, arr) => {
                                    const prev = arr.slice(0, idx).reduce((s, x) => s + (status_counts[x.key] || 0), 0);
                                    const cur = prev + (status_counts[i.key] || 0);
                                    return `${i.color} ${(prev / totalStatus) * 360}deg ${(cur / totalStatus) * 360}deg`;
                                }).join(', ')})`
                            }}>
                                <div className="w-full h-full rounded-full bg-white scale-[0.55]"></div>
                            </div>
                            <ul>
                                {statusItems.map((i) => (
                                    <StatusLegend key={i.key} label={`${i.label} (${status_counts[i.key] || 0})`} color={i.color} />
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
