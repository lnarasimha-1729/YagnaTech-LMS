import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    BsMortarboard, BsListCheck, BsJournalText, BsPeople,
    BsPersonBadge, BsChevronRight,
} from 'react-icons/bs';
import { dashboardStats } from '../../api/admin';

// Stat tile: React-icon chip + big number + label, with a tinted accent picked
// from the admin palette (skin/success/danger/gray). `to` makes the whole card
// a link to the matching management page. Tones use lightgreen/softgreen and
// the theme accents so nothing leaves the established green palette.
const StatCard = ({ icon: Icon, count, label, accent, to }) => {
    const Wrapper = to ? Link : 'div';
    return (
        <Wrapper to={to} className="ol-card card-hover block overflow-hidden">
            <div className="ol-card-body px-5 py-4 flex items-center gap-4">
                <span
                    className="w-12 h-12 rounded-ol-12 flex items-center justify-center text-[22px] shrink-0"
                    style={{ backgroundColor: accent.bg, color: accent.fg }}
                >
                    <Icon />
                </span>
                <div className="min-w-0">
                    <p className="text-[22px] leading-none text-dark font-bold mb-1">{count}</p>
                    <p className="text-[13px] text-gray truncate">{label}</p>
                </div>
            </div>
        </Wrapper>
    );
};

const StatusLegend = ({ label, count, pct, color }) => (
    <li className="flex items-center gap-2.5 py-1">
        <span className="inline-block w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
        <span className="text-[13px] text-dark flex-1">{label}</span>
        <span className="text-[13px] text-gray font-medium tabular-nums">{count}</span>
        <span className="text-[12px] text-gray/70 tabular-nums w-10 text-right">{pct}%</span>
    </li>
);

// Quick links to the pages an admin reaches most. In-palette: lightgreen hover,
// skin accents — mirrors the side-nav-link styling.
const QuickAction = ({ icon: Icon, label, to }) => (
    <Link
        to={to}
        className="flex items-center gap-3 px-4 py-3 rounded-ol-8 border border-ebordermuted hover:border-skin hover:bg-lightgreen transition-colors group"
    >
        <span className="w-9 h-9 rounded-ol-8 bg-lightgreen text-skin flex items-center justify-center text-[16px] group-hover:bg-white">
            <Icon />
        </span>
        <span className="text-[14px] font-medium text-dark group-hover:text-skin">{label}</span>
        <BsChevronRight className="ml-auto text-gray group-hover:text-skin" />
    </Link>
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

    // Each card draws from the palette: skin green, success, danger, and a
    // neutral gray — tinted background (light) + solid foreground (accent bar
    // and icon).
    // All icon chips share the first card's green palette tone (lightgreen bg,
    // skin-green icon) for a consistent look across the stat row.
    const accent = { bg: '#f4fef7', fg: '#169f48' };
    const cards = [
        { icon: BsMortarboard, label: 'Courses', count: stats.course_count || 0, to: '/admin/courses', accent },
        { icon: BsListCheck, label: 'Lessons', count: stats.lesson_count || 0, to: '/admin/courses', accent },
        { icon: BsJournalText, label: 'Enrollments', count: stats.enrollment_count || 0, to: '/admin/students', accent },
        { icon: BsPeople, label: 'Students', count: stats.student_count || 0, to: '/admin/students', accent },
    ];

    const statusItems = [
        { key: 'active', label: 'Active', color: '#12c093' },
        { key: 'upcoming', label: 'Upcoming', color: '#169f48' },
        { key: 'pending', label: 'Pending', color: '#ff2583' },
        { key: 'private', label: 'Private', color: '#0a1017' },
        { key: 'draft', label: 'Draft', color: '#878d97' },
        { key: 'inactive', label: 'Inactive', color: '#dadada' },
    ];
    const totalStatus = statusItems.reduce((s, i) => s + (status_counts[i.key] || 0), 0);
    const denom = totalStatus || 1;
    const pctOf = (n) => Math.round((n / denom) * 100);

    return (
        <div className="space-y-3">
            {/* Welcome band — plain white, with the page title. */}
            <div className="ol-card overflow-hidden">
                <div className="px-5 sm:px-6 py-5">
                    <h4 className="text-[18px] font-bold text-dark m-0">Dashboard</h4>
                    <p className="text-[13px] text-gray mt-1 m-0">
                        Overview of your courses, students and enrollments.
                    </p>
                </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                {cards.map((c) => (
                    <StatCard key={c.label} {...c} />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 items-stretch">
                {/* Course Status donut */}
                <div className="ol-card h-full lg:col-span-2">
                    <div className="ol-card-body p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-[15px] font-semibold text-dark m-0">Course Status</h4>
                            <Link to="/admin/courses" className="text-skin text-[12px] inline-flex items-center gap-1 hover:underline">
                                Explore <i className="fi-rr-arrow-up-right" />
                            </Link>
                        </div>
                        <div className="flex items-center gap-6 flex-wrap">
                            <div className="relative w-[160px] h-[160px] shrink-0">
                                <div
                                    className="w-full h-full rounded-full"
                                    style={{
                                        background: totalStatus === 0
                                            ? '#eef1fb'
                                            : `conic-gradient(${statusItems.map((i, idx, arr) => {
                                                const prev = arr.slice(0, idx).reduce((s, x) => s + (status_counts[x.key] || 0), 0);
                                                const cur = prev + (status_counts[i.key] || 0);
                                                return `${i.color} ${(prev / denom) * 360}deg ${(cur / denom) * 360}deg`;
                                            }).join(', ')})`,
                                    }}
                                />
                                {/* Centre hole + total count overlay. */}
                                <div className="absolute inset-0 m-auto w-[96px] h-[96px] rounded-full bg-white flex flex-col items-center justify-center shadow-[0_1px_6px_rgba(10,16,23,0.06)]">
                                    <span className="text-[24px] font-bold text-dark leading-none">{totalStatus}</span>
                                    <span className="text-[11px] text-gray mt-1">Total</span>
                                </div>
                            </div>
                            <ul className="flex-1 min-w-[220px]">
                                {statusItems.map((i) => (
                                    <StatusLegend
                                        key={i.key}
                                        label={i.label}
                                        count={status_counts[i.key] || 0}
                                        pct={pctOf(status_counts[i.key] || 0)}
                                        color={i.color}
                                    />
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Quick actions */}
                <div className="ol-card h-full">
                    <div className="ol-card-body p-5">
                        <h4 className="text-[15px] font-semibold text-dark mb-4 m-0">Quick actions</h4>
                        <div className="space-y-2.5">
                            <QuickAction icon={BsMortarboard} label="Manage Courses" to="/admin/courses" />
                            <QuickAction icon={BsPeople} label="Manage Students" to="/admin/students" />
                            <QuickAction icon={BsPersonBadge} label="Manage Instructors" to="/admin/instructors" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
