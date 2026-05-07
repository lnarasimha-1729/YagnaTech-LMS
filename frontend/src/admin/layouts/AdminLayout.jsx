import { useEffect, useMemo, useState } from 'react';
import { Outlet, NavLink, useLocation, Link, useNavigate } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import { logout as adminLogout, getStoredUser } from '@/admin/api/auth';

const Icon = ({ d, className = '' }) => (
    <svg
        className={`w-[18px] h-[18px] shrink-0 ${className}`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        {d}
    </svg>
);

const ICONS = {
    dashboard: <Icon d={<><path d="M3 12 12 4l9 8" /><path d="M5 10v10h14V10" /></>} />,
    category: <Icon d={<><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>} />,
    course: <Icon d={<><path d="M4 5h12a3 3 0 0 1 3 3v11H7a3 3 0 0 1-3-3V5z" /><path d="M4 5v11a3 3 0 0 0 3 3" /></>} />,
    users: <Icon d={<><circle cx="9" cy="8" r="3.2" /><path d="M2.5 20c0-3.3 2.9-6 6.5-6s6.5 2.7 6.5 6" /><circle cx="17.5" cy="9.5" r="2.5" /><path d="M15 20c0-2.3 1.5-4 3.5-4s3 1.2 3.5 3" /></>} />,
    certificate: <Icon d={<><circle cx="12" cy="9" r="5" /><path d="M8.5 13 7 21l5-3 5 3-1.5-8" /></>} />,
    college: <Icon d={<><path d="M3 21h18" /><path d="M5 21V8l7-4 7 4v13" /><path d="M9 21V12h6v9" /></>} />,
    chevron: <Icon className="ml-auto transition-transform" d={<path d="m6 9 6 6 6-6" />} />,
    external: <Icon className="w-[14px] h-[14px]" d={<><path d="M14 3h7v7" /><path d="M10 14 21 3" /><path d="M21 14v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h6" /></>} />,
    logout: <Icon d={<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /></>} />,
};

// `collegeOnly: true` items are visible ONLY to college admins (admin user
// whose college_id is set). Items without that flag are visible only to root
// admins (college_id null/empty). The filter logic in AdminLayout below
// enforces that split — root admins should never see a college's data and
// college admins should see only their dashboard.
const MENU = [
    { key: 'college', label: 'College Dashboard', icon: ICONS.college, to: '/admin/college', collegeOnly: true },
    { key: 'dashboard', label: 'Dashboard', icon: ICONS.dashboard, to: '/admin/dashboard' },
    { key: 'category', label: 'Category', icon: ICONS.category, to: '/admin/categories' },
    {
        key: 'course',
        label: 'Course',
        icon: ICONS.course,
        children: [
            { label: 'Manage Courses', to: '/admin/courses' },
            { label: 'Add New Course', to: '/admin/course/create' },
            { label: 'Coupons', to: '/admin/coupons' },
        ],
    },
    {
        key: 'certificate',
        label: 'Certificate',
        icon: ICONS.certificate,
        children: [
            { label: 'Settings', to: '/admin/certificate' },
            { label: 'Builder', to: '/admin/certificate/builder' },
            { label: 'Issued Certificates', to: '/admin/certificates' },
        ],
    },
    {
        key: 'users',
        label: 'Users',
        icon: ICONS.users,
        children: [
            {
                key: 'admin',
                label: 'Admin',
                children: [
                    { label: 'Manage Admin', to: '/admin/admins' },
                    { label: 'Add New Admin', to: '/admin/admins/create' },
                ],
            },
            {
                key: 'student',
                label: 'Student',
                children: [
                    { label: 'Manage Students', to: '/admin/students' },
                    { label: 'Add New Student', to: '/admin/students/create' },
                ],
            },
        ],
    },
];

function isGroupActive(group, pathname) {
    if (group.to && pathname.startsWith(group.to)) return true;
    if (group.children) return group.children.some((c) => isGroupActive(c, pathname));
    if (group.key === 'course') {
        return pathname.startsWith('/admin/course');
    }
    if (group.key === 'certificate') {
        return pathname.startsWith('/admin/certificate');
    }
    return false;
}

export default function AdminLayout() {
    const { pathname } = useLocation();
    const navigate = useNavigate();
    // Read localStorage once per mount. getStoredUser() does JSON.parse, which
    // returns a fresh object every call — referencing it inline on every
    // render caused downstream effects to see "new" deps and re-fire.
    const adminUser = useMemo(() => getStoredUser(), []);

    // Routing rule: only the explicit root admin sees the full sidebar. Every
    // other admin — whether they have a college_id or not — is treated as a
    // college admin and sees only the College Dashboard tab. (The dashboard
    // endpoint itself 403s if the JWT lacks a college_id, which surfaces a
    // clear "missing college" error rather than silently showing zeros.)
    const isRootAdmin = adminUser?.is_root_admin === true;
    const isCollegeAdmin = !isRootAdmin;
    const visibleMenu = MENU.filter((item) =>
        isCollegeAdmin ? item.collegeOnly === true : item.collegeOnly !== true
    );

    // Hard-stop a college admin from navigating to root-admin routes via direct
    // URL. The sidebar already hides the links; this guards typed/bookmarked URLs.
    useEffect(() => {
        if (!isCollegeAdmin) return;
        if (pathname.startsWith('/admin/college')) return;
        // Avoid redundant navigate() calls — only redirect when actually off-route.
        navigate('/admin/college', { replace: true });
    }, [isCollegeAdmin, pathname, navigate]);

    const handleLogout = async () => {
        await adminLogout();
        navigate('/login', { replace: true });
    };
    const initiallyOpen = {};
    const collectInitiallyOpen = (items, parentKey = '') => {
        items.forEach((m) => {
            if (!m.children) return;
            const key = parentKey ? `${parentKey}.${m.key || m.label}` : (m.key || m.label);
            if (isGroupActive(m, pathname)) initiallyOpen[key] = true;
            collectInitiallyOpen(m.children, key);
        });
    };
    collectInitiallyOpen(visibleMenu);
    const [open, setOpen] = useState(initiallyOpen);

    const toggle = (key) => setOpen((o) => ({ ...o, [key]: !o[key] }));

    // font-semibold is on the base class so every sidebar item — active or
    // not — renders semibold. Active state still gets the skin color; the
    // weight stays consistent so navigation feels uniform.
    const subLinkCls = ({ isActive }) =>
        `block pl-[42px] pr-3 py-[7px] text-[13px] font-semibold rounded-ol-8 transition-colors ${
            isActive ? 'text-skin' : 'text-gray hover:text-dark'
        }`;

    const nestedLinkCls = ({ isActive }) =>
        `block pl-[60px] pr-3 py-[6px] text-[13px] font-semibold rounded-ol-8 transition-colors ${
            isActive ? 'text-skin' : 'text-gray hover:text-dark'
        }`;

    const renderChild = (c, parentKey) => {
        if (c.children) {
            const subKey = `${parentKey}.${c.key || c.label}`;
            const subActive = isGroupActive(c, pathname);
            const subOpen = open[subKey];
            return (
                <li key={subKey} className="relative">
                    <button
                        type="button"
                        onClick={() => toggle(subKey)}
                        className={`w-full flex items-center pl-[42px] pr-3 py-[7px] text-[13px] font-semibold rounded-ol-8 transition-colors ${
                            subActive ? 'text-skin' : 'text-gray hover:text-dark'
                        }`}
                        aria-expanded={subOpen}
                    >
                        <span className="inline-flex items-center gap-2">
                            <span className="w-[6px] h-[6px] rounded-full bg-current opacity-60" />
                            {c.label}
                        </span>
                        <span className={`ml-auto transition-transform ${subOpen ? 'rotate-180' : ''}`}>
                            {ICONS.chevron}
                        </span>
                    </button>
                    {subOpen && (
                        <ul className="mt-1 mb-1 list-none p-0 flex flex-col gap-[2px]">
                            {c.children.map((leaf) => (
                                <li key={leaf.to}>
                                    <NavLink to={leaf.to} className={nestedLinkCls} end>
                                        {leaf.label}
                                    </NavLink>
                                </li>
                            ))}
                        </ul>
                    )}
                </li>
            );
        }
        return (
            <li key={c.to} className="relative">
                <NavLink to={c.to} className={subLinkCls} end>
                    <span className="inline-flex items-center gap-2">
                        <span className="w-[6px] h-[6px] rounded-full bg-current opacity-60" />
                        {c.label}
                    </span>
                </NavLink>
            </li>
        );
    };

    const topLinkCls = ({ isActive }) =>
        `flex items-center gap-3 px-3 py-[10px] rounded-ol-8 text-[14px] font-semibold transition-colors ${
            isActive ? 'bg-lightgreen text-skin' : 'text-gray hover:bg-lightgreen hover:text-skin'
        }`;

    return (
        <div className="admin-theme min-h-screen flex flex-col bg-bodybg">
            <Navbar />

            <div className="flex flex-1">
                <aside className="w-[260px] bg-white border-r border-border shrink-0 flex flex-col">
                    <div className="flex-1 overflow-y-auto px-3 pt-5 pb-8">
                        <p className="text-[11px] uppercase tracking-wider text-gray font-semibold px-3 mt-2 mb-2">
                            Main Menu
                        </p>
                        <nav className="flex flex-col gap-1">
                            {visibleMenu.map((item) => {
                                if (!item.children) {
                                    return (
                                        <NavLink key={item.key} to={item.to} className={topLinkCls} end>
                                            <span className="text-gray">{item.icon}</span>
                                            <span>{item.label}</span>
                                        </NavLink>
                                    );
                                }
                                const active = isGroupActive(item, pathname);
                                const isOpen = open[item.key];
                                return (
                                    <div key={item.key}>
                                        <button
                                            type="button"
                                            onClick={() => toggle(item.key)}
                                            className={`w-full flex items-center gap-3 px-3 py-[10px] rounded-ol-8 text-[14px] font-semibold transition-colors ${
                                                active ? 'bg-lightgreen text-skin' : 'text-gray hover:bg-lightgreen hover:text-skin'
                                            }`}
                                            aria-expanded={isOpen}
                                        >
                                            <span className={active ? 'text-skin' : 'text-gray'}>{item.icon}</span>
                                            <span>{item.label}</span>
                                            <span className={`ml-auto transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                                                {ICONS.chevron}
                                            </span>
                                        </button>
                                        {isOpen && (
                                            <ul className="mt-1 mb-1 list-none p-0 flex flex-col gap-[2px] relative">
                                                <span className="absolute left-[22px] top-1 bottom-1 w-px bg-ebordermuted" />
                                                {item.children.map((c) => renderChild(c, item.key))}
                                            </ul>
                                        )}
                                    </div>
                                );
                            })}
                        </nav>

                    </div>

                    <div className="px-3 py-4 border-t border-border">
                        {adminUser?.email && (
                            <div className="px-3 mb-2 text-[12px] text-gray truncate" title={adminUser.email}>
                                {adminUser.name || adminUser.email}
                            </div>
                        )}
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-3 py-[10px] rounded-ol-8 text-[14px] text-gray hover:bg-lightgreen hover:text-skin transition-colors"
                        >
                            <span className="text-gray">{ICONS.logout}</span>
                            <span>Logout</span>
                        </button>
                    </div>
                </aside>

                <main className="flex-1 p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
