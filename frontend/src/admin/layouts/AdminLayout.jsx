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
    assessment: <Icon d={<><path d="M9 4h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" /><path d="M9 9h6" /><path d="M9 13h6" /><path d="M9 17h3" /></>} />,
    program: <Icon d={<><path d="M3 7l9-4 9 4-9 4-9-4z" /><path d="M3 7v6l9 4 9-4V7" /><path d="M12 11v10" /></>} />,
    college: <Icon d={<><path d="M3 21h18" /><path d="M5 21V8l7-4 7 4v13" /><path d="M9 21V12h6v9" /></>} />,
    settings: <Icon d={<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></>} />,
    chevron: <Icon className="ml-auto transition-transform" d={<path d="m6 9 6 6 6-6" />} />,
    external: <Icon className="w-[14px] h-[14px]" d={<><path d="M14 3h7v7" /><path d="M10 14 21 3" /><path d="M21 14v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h6" /></>} />,
    logout: <Icon d={<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /></>} />,
    profile: <Icon d={<><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" /></>} />,
};

// `collegeOnly: true` items are visible ONLY to college admins (admin user
// whose college_id is set). Items without that flag are visible only to root
// admins (college_id null/empty). The filter logic in AdminLayout below
// enforces that split — root admins should never see a college's data and
// college admins should see only their dashboard.
const MENU = [
    { key: 'college', label: 'Dashboard', icon: ICONS.college, to: '/admin/college', collegeOnly: true },
    {
        key: 'batches',
        label: 'Batches',
        icon: ICONS.users,
        collegeOnly: true,
        children: [
            { label: 'Add Batch', to: '/admin/college?tab=add-batch' },
            { label: 'Manage Batches', to: '/admin/college?tab=manage-batches' },
        ],
    },
    { key: 'dashboard', label: 'Dashboard', icon: ICONS.dashboard, to: '/admin/dashboard' },
    // Category sidebar entry removed — course grouping is now driven by the
    // `clg_ids` JSON column written from the course form (CollegeMultiSelect).
    // The /admin/categories route still exists in App.tsx for direct access,
    // but it's no longer surfaced in navigation.
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
        key: 'assessment',
        label: 'Assessments',
        icon: ICONS.assessment,
        children: [
            { label: 'Manage Assessments', to: '/admin/assessments' },
            { label: 'Question Sets', to: '/admin/assessments?tab=question-sets' },
            { label: 'Questions', to: '/admin/assessments?tab=questions' },
        ],
    },
    {
        key: 'program',
        label: 'Programs',
        icon: ICONS.program,
        children: [
            { label: 'Manage Programs', to: '/admin/programs' },
            { label: 'Add New Program', to: '/admin/programs/create' },
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
            {
                key: 'instructor',
                label: 'Instructor',
                children: [
                    { label: 'Manage Instructors', to: '/admin/instructors' },
                    { label: 'Add New Instructor', to: '/admin/instructors/create' },
                ],
            },
        ],
    },
    {
        key: 'colleges',
        label: 'Colleges',
        icon: ICONS.college,
        children: [
            { label: 'Manage Colleges', to: '/admin/colleges' },
            { label: 'Add New College', to: '/admin/colleges/create' },
        ],
    },
    {
        key: 'systemSettings',
        label: 'System Settings',
        icon: ICONS.settings,
        section: 'settings',
        children: [
            { label: 'Manage Language', to: '/admin/settings/languages' },
            { label: 'Live Class Settings', to: '/admin/settings/live-class' },
        ],
    },
];

function isGroupActive(group, pathname, search = '') {
    // Use boundary-aware match so /admin/college doesn't claim /admin/colleges
    // (and vice versa). Exact match OR `to` followed by a `/` segment. When the
    // leaf carries a query string (e.g. `?tab=add-batch`), also require the
    // query to match so deep-linked siblings don't all light up.
    if (group.to) {
        const [toPath, toQuery = ''] = group.to.split('?');
        if (pathname === toPath || pathname.startsWith(toPath + '/')) {
            if (!toQuery) return true;
            const cur = new URLSearchParams(search);
            const target = new URLSearchParams(toQuery);
            const matches = [...target.entries()].every(([k, v]) => cur.get(k) === v);
            if (matches) return true;
        }
    }
    if (group.children) return group.children.some((c) => isGroupActive(c, pathname, search));
    if (group.key === 'course') {
        return pathname.startsWith('/admin/course');
    }
    if (group.key === 'certificate') {
        return pathname.startsWith('/admin/certificate');
    }
    if (group.key === 'program') {
        return pathname.startsWith('/admin/programs');
    }
    if (group.key === 'assessment') {
        return pathname.startsWith('/admin/assessments');
    }
    // Note: `batches` is a children-only group, so the recursion above
    // already lights it up whenever any child's pathname+query matches
    // (see the renderChild matchesLeaf wiring). No special case needed.
    return false;
}

export default function AdminLayout() {
    const { pathname, search } = useLocation();
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
    const isInstructor = adminUser?.role === 'instructor';
    const isRootAdmin = !isInstructor && adminUser?.is_root_admin === true;
    const isCollegeAdmin = !isInstructor && !isRootAdmin;

    // Three cohorts, three sidebars:
    //   - Instructor: only the Course group (Manage Courses), and only the
    //     Curriculum + Live Class tabs inside Edit Course (see Edit.jsx).
    //   - College admin: only College Dashboard.
    //   - Root admin: full menu.
    let visibleMenu;
    if (isInstructor) {
        // Only the Course group, and within it only "Manage Courses" —
        // instructors manage the courses they're assigned to but can't
        // create new courses or touch coupons.
        visibleMenu = MENU
            .filter((item) => item.key === 'course' && !item.collegeOnly)
            .map((item) => ({
                ...item,
                children: (item.children || []).filter((c) => c.to === '/admin/courses'),
            }));
    } else if (isCollegeAdmin) {
        visibleMenu = MENU.filter((item) => item.collegeOnly === true);
    } else {
        visibleMenu = MENU.filter((item) => item.collegeOnly !== true);
    }

    // Hard-stop direct URL access to routes outside an instructor's surface.
    // Instructors are allowed on the course list and the course-edit page.
    // Edit Course tabs are filtered inside Edit.jsx.
    const isInstructorPathAllowed = (p) =>
        p === '/admin' ||
        p === '/admin/' ||
        p === '/admin/courses' ||
        p.startsWith('/admin/courses?') ||
        p === '/admin/profile' ||
        /^\/admin\/course\/edit\/\d+/.test(p);

    useEffect(() => {
        if (isInstructor) {
            if (!isInstructorPathAllowed(pathname)) {
                navigate('/admin/courses', { replace: true });
            }
            return;
        }
        if (!isCollegeAdmin) return;
        if (pathname.startsWith('/admin/college')) return;
        // Manage Profile is available to every admin role, so don't bounce a
        // college admin off it back to their dashboard.
        if (pathname === '/admin/profile') return;
        // Avoid redundant navigate() calls — only redirect when actually off-route.
        navigate('/admin/college', { replace: true });
    }, [isInstructor, isCollegeAdmin, pathname, navigate]);

    const handleLogout = async () => {
        await adminLogout();
        navigate('/login', { replace: true });
    };
    const initiallyOpen = {};
    const collectInitiallyOpen = (items, parentKey = '') => {
        items.forEach((m) => {
            if (!m.children) return;
            const key = parentKey ? `${parentKey}.${m.key || m.label}` : (m.key || m.label);
            if (isGroupActive(m, pathname, search)) initiallyOpen[key] = true;
            collectInitiallyOpen(m.children, key);
        });
    };
    collectInitiallyOpen(visibleMenu);
    const [open, setOpen] = useState(initiallyOpen);

    const toggle = (key) => setOpen((o) => ({ ...o, [key]: !o[key] }));

    // font-semibold is on the base class so every sidebar item — active or
    // not — renders semibold. Active state still gets the skin color; the
    // weight stays consistent so navigation feels uniform.
    const renderChild = (c, parentKey) => {
        if (c.children) {
            const subKey = `${parentKey}.${c.key || c.label}`;
            const subActive = isGroupActive(c, pathname, search);
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
                                    <NavLink
                                        to={leaf.to}
                                        className={nestedLinkClsFor(leaf.to, pathname, search)}
                                        end
                                    >
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
                <NavLink
                    to={c.to}
                    className={subLinkClsFor(c.to, pathname, search)}
                    end
                >
                    <span className="inline-flex items-center gap-2">
                        <span className="w-[6px] h-[6px] rounded-full bg-current opacity-60" />
                        {c.label}
                    </span>
                </NavLink>
            </li>
        );
    };

    // For sidebar leaves whose `to` includes a query string (e.g. Assessments
    // sub-tabs use `?tab=questions`), NavLink's default isActive only matches
    // by pathname — so all three would highlight at once. These helpers do a
    // pathname + query-string compare so the correct tab lights up.
    const matchesLeaf = (leafTo, p, s) => {
        const [leafPath, leafQuery = ''] = leafTo.split('?');
        if (leafPath !== p) return false;
        const current = new URLSearchParams(s);
        const target = new URLSearchParams(leafQuery);
        if ([...target.keys()].length === 0) {
            // The "default tab" entry has no query — active only when no tab=
            return !current.get('tab');
        }
        for (const [k, v] of target.entries()) {
            if (current.get(k) !== v) return false;
        }
        return true;
    };
    const subLinkClsFor = (leafTo, p, s) => () =>
        `block pl-[42px] pr-3 py-[7px] text-[13px] font-semibold rounded-ol-8 transition-colors ${
            matchesLeaf(leafTo, p, s) ? 'text-skin' : 'text-gray hover:text-dark'
        }`;
    const nestedLinkClsFor = (leafTo, p, s) => () =>
        `block pl-[60px] pr-3 py-[6px] text-[13px] font-semibold rounded-ol-8 transition-colors ${
            matchesLeaf(leafTo, p, s) ? 'text-skin' : 'text-gray hover:text-dark'
        }`;

    const topLinkCls = ({ isActive }) =>
        `flex items-center gap-3 px-3 py-[10px] rounded-ol-8 text-[14px] font-semibold transition-colors ${
            isActive ? 'bg-lightgreen text-skin' : 'text-gray hover:bg-lightgreen hover:text-skin'
        }`;

    return (
        <div className="admin-theme h-screen overflow-hidden flex flex-col bg-bodybg">
            <Navbar />

            <div className="flex flex-1 min-h-0">
                <aside className="w-[260px] bg-white border-r border-border shrink-0 flex flex-col">
                    <div className="flex-1 overflow-y-auto no-scrollbar px-3 pt-5 pb-8">
                        <nav className="flex flex-col gap-1">
                            {(() => {
                                const renderItem = (item) => {
                                    if (!item.children) {
                                        // Let the icon inherit color from the NavLink so it
                                        // flips to text-skin alongside the label when active
                                        // (Icon uses stroke="currentColor"). Without this the
                                        // hardcoded text-gray kept the icon grey on /admin/dashboard
                                        // and /admin/categories.
                                        //
                                        // College Dashboard shares its pathname with the Batches
                                        // sub-tabs (`/admin/college?tab=…`). Plain NavLink would
                                        // highlight the Dashboard link AND the Batches group
                                        // whenever a batch tab is active. Use the query-aware
                                        // matchesLeaf so Dashboard only lights up on the bare
                                        // pathname (no `tab` param).
                                        const cls = item.to.includes('?') || ['/admin/college'].includes(item.to)
                                            ? () => topLinkCls({ isActive: matchesLeaf(item.to, pathname, search) })
                                            : topLinkCls;
                                        return (
                                            <NavLink key={item.key} to={item.to} className={cls} end>
                                                {item.icon}
                                                <span>{item.label}</span>
                                            </NavLink>
                                        );
                                    }
                                    const active = isGroupActive(item, pathname, search);
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
                                };

                                const mainItems = visibleMenu.filter((i) => i.section !== 'settings');
                                const settingsItems = visibleMenu.filter((i) => i.section === 'settings');

                                return (
                                    <>
                                        <p className="text-[11px] uppercase tracking-wider text-gray font-semibold px-3 mt-2 mb-2">
                                            Main Menu
                                        </p>
                                        {mainItems.map(renderItem)}
                                        {settingsItems.length > 0 && (
                                            <>
                                                <p className="text-[11px] uppercase tracking-wider text-gray font-semibold px-3 mt-4 mb-2">
                                                    Settings
                                                </p>
                                                {settingsItems.map(renderItem)}
                                            </>
                                        )}
                                    </>
                                );
                            })()}
                        </nav>

                    </div>

                    <div className="px-3 py-2 border-t border-border">
                        {adminUser?.email && (
                            <div className="px-3 mb-1 text-[12px] text-gray truncate" title={adminUser.email}>
                                {adminUser.name || adminUser.email}
                            </div>
                        )}
                        <NavLink
                            to="/admin/profile"
                            className={({ isActive }) =>
                                `w-full flex items-center gap-3 px-3 py-[6px] rounded-ol-8 text-[14px] transition-colors ${
                                    isActive ? 'bg-lightgreen text-skin' : 'text-gray hover:bg-lightgreen hover:text-skin'
                                }`
                            }
                        >
                            <span>{ICONS.profile}</span>
                            <span>Manage Profile</span>
                        </NavLink>
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-3 py-[6px] rounded-ol-8 text-[14px] text-gray hover:bg-lightgreen hover:text-skin transition-colors"
                        >
                            <span className="text-gray">{ICONS.logout}</span>
                            <span>Logout</span>
                        </button>
                    </div>
                </aside>

                {/* min-w-0 — a flex child defaults to min-width:auto, which
                    lets wide content (e.g. data tables) push <main> past the
                    viewport and scroll the whole page. min-w-0 lets it shrink
                    so a page's own overflow-x container scrolls instead. */}
                <main className="flex-1 min-w-0 overflow-y-auto no-scrollbar p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
