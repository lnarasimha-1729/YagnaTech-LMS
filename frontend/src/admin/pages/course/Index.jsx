import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useSearchParams } from 'react-router-dom';
import { BsThreeDotsVertical } from 'react-icons/bs';
import { toast } from 'react-toastify';
import ConfirmDialog from '../../components/ConfirmDialog';
import Modal from '../../components/Modal';
import {
    listCourses, deleteCourse, setCourseStatus, duplicateCourse, approveCourse,
} from '../../api/course';
import { listCategories } from '../../api/category';

// VITE_ADMIN_API_URL points at admin-service (port 4000) — fine for asset
// URLs (uploaded images) but wrong for "view course on frontend" links,
// which need to land on the public site.
const PUBLIC_BASE = import.meta.env.VITE_ADMIN_API_URL || 'http://localhost:4000';
// Where the student-facing site lives. Override with VITE_FRONTEND_URL in
// production. Empty string is treated as same-origin (useful when admin and
// public site are served from the same domain).
const FRONTEND_BASE = import.meta.env.VITE_FRONTEND_URL ?? 'http://localhost:8080';

const STATUS_BADGE = {
    active: 'bg-green-100 text-green-700',
    inactive: 'bg-gray-200 text-gray-700',
    pending: 'bg-yellow-100 text-yellow-700',
    upcoming: 'bg-blue-100 text-blue-700',
    private: 'bg-purple-100 text-purple-700',
    draft: 'bg-slate-200 text-slate-700',
};

export default function CourseIndex() {
    const [params, setParams] = useSearchParams();
    const [data, setData] = useState(null);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [confirm, setConfirm] = useState(null);
    const [approval, setApproval] = useState(null);
    const [approvalSubject, setApprovalSubject] = useState('');
    const [approvalMessage, setApprovalMessage] = useState('');
    const [approving, setApproving] = useState(false);

    const query = Object.fromEntries(params.entries());

    const load = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await listCourses(query);
            setData(res);
        } catch (err) {
            console.error(err);
            setError(err?.response?.data?.error || err?.message || 'Failed to load courses');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); /* eslint-disable-next-line */ }, [params]);
    useEffect(() => {
        listCategories()
            .then((r) => setCategories(r.categories || []))
            .catch(() => setCategories([]));
    }, []);

    const applyFilters = (next) => {
        const cleaned = {};
        Object.entries(next).forEach(([k, v]) => { if (v && v !== 'all') cleaned[k] = v; });
        setParams(cleaned);
    };

    const clearFilters = () => setParams({});

    const onSearch = (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const term = (fd.get('search') || '').toString().trim();
        const next = { ...query };
        if (term) next.search = term; else delete next.search;
        setParams(next);
    };

    const handlePrint = () => window.print();
    const handleExportPdf = () => window.print();

    const handleDelete = async (id) => {
        try { await deleteCourse(id); toast.success('Course deleted successfully'); setConfirm(null); load(); }
        catch (e) { toast.error(e.response?.data?.error || 'Failed'); setConfirm(null); }
    };

    const handleStatus = async (type, id) => {
        try { await setCourseStatus(type, id); toast.success('Course status changed'); load(); }
        catch (e) { toast.error(e.response?.data?.error || 'Failed'); }
    };

    const handleDuplicate = async (id) => {
        try { await duplicateCourse(id); toast.success('Course duplicated'); load(); }
        catch (e) { toast.error(e.response?.data?.error || 'Failed'); }
    };

    const openApproval = (course) => {
        setApprovalSubject(`Your course "${course.title}" has been approved`);
        setApprovalMessage(`<p>Hi,</p><p>Your course "${course.title}" has been activated and is now live.</p>`);
        setApproval(course);
    };

    const handleApprove = async (e) => {
        e.preventDefault();
        setApproving(true);
        try {
            await approveCourse(approval.id, { subject: approvalSubject, message: approvalMessage });
            toast.success('Course activated successfully');
            setApproval(null);
            load();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed');
        } finally {
            setApproving(false);
        }
    };

    if (loading && !data) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-gray">
                <div className="w-10 h-10 border-4 border-gray-200 border-t-skin rounded-full animate-spin mb-3" />
                <p className="text-[14px]">Loading courses…</p>
            </div>
        );
    }

    if (error && !data) {
        return (
            <div className="ol-card rounded-ol-8">
                <div className="ol-card-body py-10 px-6 text-center">
                    <p className="text-[16px] font-semibold text-danger mb-2">Couldn’t load courses</p>
                    <p className="text-[13px] text-gray mb-4">{error}</p>
                    <button className="ol-btn-primary" onClick={load}>Retry</button>
                </div>
            </div>
        );
    }

    const stats = [
        { label: 'Active courses', value: data.active_courses, filter: { status: 'active' } },
        { label: 'Pending courses', value: data.pending_courses, filter: { status: 'pending' } },
        { label: 'Upcoming courses', value: data.upcoming_courses, filter: { status: 'upcoming' } },
        { label: 'Free courses', value: data.free_courses, filter: { price: 'free' } },
        { label: 'Paid courses', value: data.paid_courses, filter: { price: 'paid' } },
    ];

    const rows = data.courses.data;
    const isEmpty = rows.length === 0;

    return (
        <div>
            <div className="ol-card rounded-ol-8 mb-3">
                <div className="ol-card-body py-12px px-20px my-3">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <h4 className="text-[16px] font-semibold text-dark m-0 flex items-center gap-2">
                            <i className="fi-rr-settings-sliders" />
                            Manage Courses
                        </h4>
                        <Link className="ol-btn-outline-secondary flex items-center gap-10px" to="/admin/course/create">
                            <span className="fi-rr-plus" />
                            <span>Add New Course</span>
                        </Link>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3 mb-3">
                {stats.map((s) => (
                    <button type="button" className="stat-card text-left" key={s.label} onClick={() => setParams(s.filter)}>
                        <div className="stat-card-body py-12px px-3">
                            <p className="text-[14px] font-semibold text-dark mb-2 m-0">{s.value ?? 0}</p>
                            <h6 className="text-[14px] text-gray m-0">{s.label}</h6>
                        </div>
                    </button>
                ))}
            </div>

            <div className="ol-card">
                <div className="ol-card-body mb-5">
                    <div className="grid grid-cols-12 gap-3 mb-4 mt-3 items-center">
                        <div className="col-span-12 md:col-span-6 flex items-center gap-3">
                            <ExportDropdown onPdf={handleExportPdf} onPrint={handlePrint} />
                            <FilterDropdown
                                query={query}
                                categories={categories}
                                courses={rows}
                                onApply={applyFilters}
                            />
                            {Object.keys(query).length > 0 && (
                                <button
                                    type="button"
                                    className="text-gray hover:text-danger"
                                    onClick={clearFilters}
                                    title="Clear"
                                >
                                    <i className="fi-rr-cross-circle text-[18px]" />
                                </button>
                            )}
                        </div>
                        <div className="col-span-12 md:col-span-6">
                            <form onSubmit={onSearch}>
                                <div className="grid grid-cols-12 gap-3">
                                    <div className="col-span-12 md:col-span-9">
                                        <input
                                            className="ol-form-control w-full"
                                            name="search"
                                            type="text"
                                            placeholder="Search Title"
                                            defaultValue={query.search || ''}
                                        />
                                    </div>
                                    <div className="col-span-12 md:col-span-3">
                                        <button type="submit" className="ol-btn-primary w-full">Search</button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>

                    <div className="flex justify-between items-center flex-wrap gap-3 mb-3">
                        <p className="text-gray text-[14px] m-0">
                            Showing {rows.length} of {data.courses.total} data
                        </p>
                        {loading && <span className="text-[12px] text-gray">Refreshing…</span>}
                    </div>

                    {isEmpty ? (
                        <div className="py-12 text-center border border-dashed border-border rounded-ol-8">
                            <p className="text-[16px] font-semibold text-dark mb-1">No courses found</p>
                            <p className="text-[13px] text-gray">Try adjusting your filters or add a new course.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="e-table">
                                <thead>
                                    <tr>
                                        <th scope="col">#</th>
                                        <th scope="col">Title</th>
                                        <th scope="col">Category</th>
                                        <th scope="col">Lesson & Section</th>
                                        <th scope="col">Enrolled Student</th>
                                        <th scope="col">Status</th>
                                        <th scope="col">Price</th>
                                        <th scope="col">Options</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((c, i) => (
                                        <tr key={c.id}>
                                            <td>{(data.courses.current_page - 1) * data.courses.per_page + i + 1}</td>
                                            <td className="min-w-[220px]">
                                                <div>
                                                    <h4 className="text-[14px] font-semibold text-dark m-0">
                                                        <Link to={`/admin/course/edit/${c.id}`} className="hover:text-skin">
                                                            {c.title}
                                                        </Link>
                                                    </h4>
                                                    {c.instructor && (
                                                        <div className="mt-1">
                                                            <p className="text-[12px] text-gray m-0">Instructor: {c.instructor.name}</p>
                                                            <p className="text-[12px] text-gray m-0">Email: {c.instructor.email}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <span className="text-[12px] text-gray">
                                                    {c.category?.title || '-'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="text-[12px] text-gray">
                                                    <p className="m-0">Lesson: {c.lesson_count ?? 0}</p>
                                                    <p className="m-0">Section: {c.section_count ?? 0}</p>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="text-[12px] text-gray">
                                                    {(c.enrolled ?? 0)} students
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`inline-block px-2 py-1 rounded-ol-8 text-[11px] font-semibold capitalize ${STATUS_BADGE[c.status] || 'bg-gray-100 text-gray-600'}`}>
                                                    {c.status}
                                                </span>
                                            </td>
                                            <td className="min-w-[120px]">
                                                {c.is_paid === 0 || c.is_paid === false ? (
                                                    <span className="inline-block px-2 py-1 bg-green-50 text-green-700 rounded-ol-8 text-[11px] font-semibold">Free</span>
                                                ) : c.discount_flag ? (
                                                    <p className="m-0 text-dark">
                                                        <span className="text-skin font-semibold">${Number(c.discounted_price).toFixed(2)}</span>{' '}
                                                        <del className="text-gray text-[12px]">${Number(c.price).toFixed(2)}</del>
                                                    </p>
                                                ) : (
                                                    <span className="text-skin font-semibold">${Number(c.price).toFixed(2)}</span>
                                                )}
                                            </td>
                                            <td>
                                                <OptionsDropdown
                                                    course={c}
                                                    onDuplicate={() => handleDuplicate(c.id)}
                                                    onDelete={() => setConfirm(c.id)}
                                                    onMakeActive={() => handleStatus('active', c.id)}
                                                    onMakeInactive={() => handleStatus('inactive', c.id)}
                                                    onApprove={() => openApproval(c)}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {!isEmpty && (
                        <Pagination
                            total={data.courses.last_page}
                            current={data.courses.current_page}
                            onPage={(p) => setParams({ ...query, page: p })}
                        />
                    )}
                </div>
            </div>

            {confirm && (
                <ConfirmDialog
                    message="Delete this course?"
                    onCancel={() => setConfirm(null)}
                    onConfirm={() => handleDelete(confirm)}
                />
            )}

            {approval && (
                <Modal title={`Approve "${approval.title}"`} onClose={() => setApproval(null)} size="lg">
                    <form onSubmit={handleApprove}>
                        <div className="mb-3">
                            <label className="ol-form-label">Subject</label>
                            <input className="ol-form-control" value={approvalSubject} onChange={(e) => setApprovalSubject(e.target.value)} />
                        </div>
                        <div className="mb-3">
                            <label className="ol-form-label">Message</label>
                            <textarea className="ol-form-control" rows="6" value={approvalMessage} onChange={(e) => setApprovalMessage(e.target.value)} />
                        </div>
                        <div className="text-center">
                            <button className="ol-btn-primary w-full" disabled={approving}>
                                {approving ? 'Sending…' : 'Send approval email'}
                            </button>
                        </div>
                    </form>
                </Modal>
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
        <div className="relative" ref={ref}>
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

function FilterDropdown({ query, categories, courses, onApply }) {
    const [open, setOpen] = useState(false);
    const [local, setLocal] = useState({
        category: query.category || 'all',
        status: query.status || 'all',
        instructor: query.instructor || 'all',
        price: query.price || 'all',
    });
    const ref = useRef(null);

    useEffect(() => {
        setLocal({
            category: query.category || 'all',
            status: query.status || 'all',
            instructor: query.instructor || 'all',
            price: query.price || 'all',
        });
    }, [query.category, query.status, query.instructor, query.price]);

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

    const instructors = useMemo(() => {
        const seen = new Map();
        (courses || []).forEach((c) => {
            if (c.instructor && !seen.has(c.instructor.id)) {
                seen.set(c.instructor.id, { id: c.instructor.id, name: c.instructor.name });
            } else if (c.user_id && !seen.has(c.user_id)) {
                seen.set(c.user_id, { id: c.user_id, name: `User #${c.user_id}` });
            }
        });
        return Array.from(seen.values());
    }, [courses]);

    const activeCount = Object.entries(query).filter(([, v]) => v && v !== 'all').length;

    const change = (k, v) => setLocal((s) => ({ ...s, [k]: v }));

    const submit = (e) => {
        e.preventDefault();
        onApply({ ...query, ...local });
        setOpen(false);
    };

    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                className="ol-btn-light inline-flex items-center gap-2"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
            >
                <i className="fi-rr-filter" />
                Filter
                {activeCount > 0 && <span className="text-[12px]">({activeCount})</span>}
            </button>
            {open && (
                <div className="absolute left-0 z-20 mt-1 w-[280px] bg-white border border-border rounded-ol-8 shadow-lg p-4">
                    <form onSubmit={submit} className="flex flex-col gap-3">
                        <div>
                            <label className="ol-form-label">Category</label>
                            <select
                                className="ol-form-control w-full"
                                value={local.category}
                                onChange={(e) => change('category', e.target.value)}
                            >
                                <option value="all">All</option>
                                {categories.map((c) => (
                                    <optgroup key={c.id} label={c.title}>
                                        <option value={c.slug}>{c.title}</option>
                                        {c.childs?.map((sub) => (
                                            <option key={sub.id} value={sub.slug}>-- {sub.title}</option>
                                        ))}
                                    </optgroup>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="ol-form-label">Status</label>
                            <select
                                className="ol-form-control w-full"
                                value={local.status}
                                onChange={(e) => change('status', e.target.value)}
                            >
                                <option value="all">All</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="pending">Pending</option>
                                <option value="upcoming">Upcoming</option>
                                <option value="private">Private</option>
                                <option value="draft">Draft</option>
                            </select>
                        </div>
                        <div>
                            <label className="ol-form-label">Instructor</label>
                            <select
                                className="ol-form-control w-full"
                                value={local.instructor}
                                onChange={(e) => change('instructor', e.target.value)}
                            >
                                <option value="all">All</option>
                                {instructors.map((i) => (
                                    <option key={i.id} value={i.id}>{i.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="ol-form-label">Price</label>
                            <select
                                className="ol-form-control w-full"
                                value={local.price}
                                onChange={(e) => change('price', e.target.value)}
                            >
                                <option value="all">All</option>
                                <option value="free">Free</option>
                                <option value="paid">Paid</option>
                            </select>
                        </div>
                        <div className="flex justify-end mt-1">
                            <button type="submit" className="ol-btn-primary">Apply</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}

function OptionsDropdown({ course, onDuplicate, onDelete, onMakeActive, onMakeInactive, onApprove }) {
    const [open, setOpen] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const triggerRef = useRef(null);
    const menuRef = useRef(null);

    // Position the portal-rendered menu relative to its trigger when it opens.
    // Close on outside-click, Escape, or scroll/resize — this matches typical dropdown UX
    // and avoids the menu floating over unrelated content as the page moves.
    useEffect(() => {
        if (!open) return;
        const el = triggerRef.current;
        if (el) {
            const rect = el.getBoundingClientRect();
            const MENU_WIDTH = 220;
            // Approx height: 6 items × ~36px + padding. Real height isn't known until paint,
            // but this is enough to decide whether to flip up.
            const ESTIMATED_MENU_HEIGHT = 250;
            const GAP = 4;

            let left = rect.right - MENU_WIDTH;
            if (left < 8) left = 8;
            if (left + MENU_WIDTH > window.innerWidth - 8) left = window.innerWidth - MENU_WIDTH - 8;

            // Default: open below. Flip above if there isn't room and there's more space above.
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
        const onDocClick = (e) => {
            if (triggerRef.current?.contains(e.target)) return;
            if (menuRef.current?.contains(e.target)) return;
            setOpen(false);
        };
        const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
        const onScroll = () => setOpen(false);
        const onResize = () => setOpen(false);
        // Capture phase so scrolls on inner containers also dismiss the menu.
        window.addEventListener('scroll', onScroll, true);
        window.addEventListener('resize', onResize);
        document.addEventListener('mousedown', onDocClick);
        document.addEventListener('keydown', onKey);
        return () => {
            window.removeEventListener('scroll', onScroll, true);
            window.removeEventListener('resize', onResize);
            document.removeEventListener('mousedown', onDocClick);
            document.removeEventListener('keydown', onKey);
        };
    }, [open]);

    const close = () => setOpen(false);

    // Frontend URLs must match the routes defined in the public-site App.tsx:
    //   /courses/programs/course-details          -> CourseDetailsPage (reads ?slug & ?program_id)
    //   /courses/programs/course-details/play/:slug -> CoursePlayer
    // Old paths (/course/:slug, /play-course/:slug) don't exist there.
    // program_id is optional — the details page falls back to enrolment lookup
    // if it's missing, so we only append it when the row carries one.
    const detailsParams = new URLSearchParams({ slug: course.slug });
    const programId = course.program_id ?? course.programId ?? null;
    if (programId) detailsParams.set('program_id', String(programId));
    const frontendUrl = `${FRONTEND_BASE}/courses/programs/course-details?${detailsParams.toString()}`;
    const playerUrl = `${FRONTEND_BASE}/courses/programs/course-details/play/${course.slug}`;

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
                    style={{ position: 'fixed', top: coords.top, left: coords.left }}
                    className="z-[1000] min-w-[220px] bg-white border border-border rounded-ol-8 shadow-lg py-1 text-[13px]"
                >
                    <li>
                        <a
                            className="block px-3 py-2 text-dark hover:bg-gray-50"
                            href={frontendUrl}
                            target="_blank"
                            rel="noreferrer"
                            onClick={close}
                        >
                            View Course On Frontend
                        </a>
                    </li>
                    <li>
                        <a
                            className="block px-3 py-2 text-dark hover:bg-gray-50"
                            href={playerUrl}
                            target="_blank"
                            rel="noreferrer"
                            onClick={close}
                        >
                            Go To Course Playing Page
                        </a>
                    </li>
                    <li>
                        <Link
                            className="block px-3 py-2 text-dark hover:bg-gray-50"
                            to={`/admin/course/edit/${course.id}`}
                            onClick={close}
                        >
                            Edit Course
                        </Link>
                    </li>
                    <li>
                        <button
                            type="button"
                            className="w-full text-left block px-3 py-2 text-dark hover:bg-gray-50"
                            onClick={() => { close(); onDuplicate(); }}
                        >
                            Duplicate Course
                        </button>
                    </li>
                    {course.status === 'active' ? (
                        <li>
                            <button
                                type="button"
                                className="w-full text-left block px-3 py-2 text-dark hover:bg-gray-50"
                                onClick={() => { close(); onMakeInactive(); }}
                            >
                                Make As Inactive
                            </button>
                        </li>
                    ) : course.status === 'pending' ? (
                        <li>
                            <button
                                type="button"
                                className="w-full text-left block px-3 py-2 text-dark hover:bg-gray-50"
                                onClick={() => { close(); onApprove(); }}
                            >
                                Make As Active
                            </button>
                        </li>
                    ) : (
                        <li>
                            <button
                                type="button"
                                className="w-full text-left block px-3 py-2 text-dark hover:bg-gray-50"
                                onClick={() => { close(); onMakeActive(); }}
                            >
                                Make As Active
                            </button>
                        </li>
                    )}
                    <li>
                        <button
                            type="button"
                            className="w-full text-left block px-3 py-2 text-danger hover:bg-gray-50"
                            onClick={() => { close(); onDelete(); }}
                        >
                            Delete Course
                        </button>
                    </li>
                </ul>,
                document.body,
            )}
        </div>
    );
}

function Pagination({ total, current, onPage }) {
    if (total <= 1) return null;
    return (
        <nav className="mt-4">
            <ul className="flex flex-wrap gap-2 list-none p-0 m-0">
                {Array.from({ length: total }, (_, i) => i + 1).map((p) => (
                    <li key={p}>
                        <button
                            className={`e-page-link ${p === current ? 'e-page-link-active' : ''}`}
                            onClick={() => onPage(p)}
                        >
                            {p}
                        </button>
                    </li>
                ))}
            </ul>
        </nav>
    );
}
