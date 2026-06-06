import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { BsThreeDotsVertical } from 'react-icons/bs';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import ProgramForm from './ProgramForm';
import {
    listPrograms,
    updateProgram,
    deleteProgram,
} from '../../api/program';
import { listCourses } from '../../api/course';
import { useCollege } from '@/hooks/useCollege';

export default function ProgramIndex() {
    const [programs, setPrograms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // Resolve clgId -> clgName + course_id -> course title so the table shows
    // human-readable values instead of raw ids. Both hydrate once on mount;
    // the colleges hook is also shared with the Course pages so the cache is
    // warm if the admin has been navigating around.
    const { colleges } = useCollege();
    const collegeNameById = useMemo(() => {
        const map = {};
        (colleges || []).forEach((c) => { map[c.clgId] = c.clgName; });
        return map;
    }, [colleges]);
    const [courseById, setCourseById] = useState({});
    useEffect(() => {
        let alive = true;
        listCourses({})
            .then((r) => {
                if (!alive) return;
                const rows = Array.isArray(r?.courses?.data) ? r.courses.data : [];
                const map = {};
                rows.forEach((c) => { map[String(c.id)] = c.title; });
                setCourseById(map);
            })
            .catch(() => { /* best-effort — table just falls back to id */ });
        return () => { alive = false; };
    }, []);
    // Edit is still inline because the row needs no extra navigation context
    // to mutate (unlike Add, which now has its own page). modal === null means
    // no edit modal; modal === {data: program} opens edit for that row.
    const [modal, setModal] = useState(null);
    const [confirm, setConfirm] = useState(null);

    const load = async () => {
        setLoading(true);
        setError(null);
        try {
            const { programs } = await listPrograms();
            setPrograms(Array.isArray(programs) ? programs : []);
        } catch (e) {
            setError(e?.response?.data?.error || e?.message || 'Failed to load programs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    // listPrograms() returns the full set (no pagination), so every row is in
    // `programs` — a plain print captures them all. The shared print CSS shows
    // only the table; the Options column is marked no-print.
    const handlePrint = () => window.print();

    const handleEditSubmit = async (data) => {
        if (!modal?.data) return;
        setSubmitting(true);
        try {
            await updateProgram(modal.data.id, data);
            toast.success('Program updated successfully');
            setModal(null);
            load();
        } catch (e) {
            toast.error(e?.response?.data?.error || 'Failed');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteProgram(id);
            toast.success('Program deleted successfully');
            setConfirm(null);
            load();
        } catch (e) {
            toast.error(e?.response?.data?.error || 'Failed');
            setConfirm(null);
        }
    };

    return (
        <div>
            <div className="ol-card rounded-ol-8 mb-3">
                <div className="ol-card-body py-12px px-20px my-3">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <h4 className="text-[16px] font-semibold text-dark m-0 flex items-center gap-2">
                            <i className="fi-rr-graduation-cap" />
                            Manage Programs{' '}
                            <span className="text-muted font-normal">({programs.length})</span>
                        </h4>
                        <div className="flex items-center gap-2">
                            {programs.length > 0 && (
                                <ExportDropdown onPdf={handlePrint} onPrint={handlePrint} />
                            )}
                            <Link
                                to="/admin/programs/create"
                                className="ol-btn-outline-secondary flex items-center gap-10px"
                            >
                                <span className="fi-rr-plus" />
                                <span>Add New Program</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {loading && (
                <div className="ol-card rounded-ol-8">
                    <div className="ol-card-body py-10 px-6 text-center">
                        <p className="text-[13px] text-gray m-0">Loading programs…</p>
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

            {!loading && !error && programs.length === 0 && (
                <div className="ol-card rounded-ol-8">
                    <div className="ol-card-body py-10 px-6 text-center">
                        <p className="text-[14px] text-gray m-0">
                            No programs yet. Click <strong>Add New Program</strong> to create your first one.
                        </p>
                    </div>
                </div>
            )}

            {!loading && !error && programs.length > 0 && (
                <div className="ol-card rounded-ol-8">
                    <div className="ol-card-body p-0 overflow-x-auto e-table-scroll-y print-area">
                        <table className="e-table w-full">
                            <thead>
                                <tr>
                                    <th scope="col" className="w-[60px]">#</th>
                                    <th scope="col">Program title</th>
                                    <th scope="col">College</th>
                                    <th scope="col">Course</th>
                                    <th scope="col" className="no-print">Options</th>
                                </tr>
                            </thead>
                            <tbody>
                                {programs.map((p, i) => (
                                    <tr key={p.id}>
                                        <td>{i + 1}</td>
                                        <td>
                                            <div className="flex flex-col">
                                                <span className="text-[14px] font-semibold text-dark">
                                                    {p.title}
                                                </span>
                                                {p.tagline && (
                                                    <span className="text-[12px] text-gray truncate max-w-[420px]">
                                                        {p.tagline}
                                                    </span>
                                                )}
                                                {p.is_active === false && (
                                                    <span className="mt-1 inline-flex items-center px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 text-[10px] self-start">
                                                        Inactive
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <CollegeChips
                                                clgIds={Array.isArray(p.clg_ids) ? p.clg_ids : []}
                                                nameById={collegeNameById}
                                            />
                                        </td>
                                        <td>
                                            <CourseChips
                                                courseIds={
                                                    Array.isArray(p.course_ids) && p.course_ids.length
                                                        ? p.course_ids
                                                        : (p.course_id ? [p.course_id] : [])
                                                }
                                                titleById={courseById}
                                            />
                                        </td>
                                        <td className="no-print">
                                            <OptionsDropdown
                                                onEdit={() => setModal({ data: p })}
                                                onDelete={() => setConfirm(p.id)}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {modal?.data && (
                <Modal title={`Edit program — ${modal.data.title}`} onClose={() => setModal(null)}>
                    <ProgramForm
                        initial={modal.data}
                        onSubmit={handleEditSubmit}
                        submitting={submitting}
                    />
                </Modal>
            )}
            {confirm && (
                <ConfirmDialog
                    message="Delete this program?"
                    onCancel={() => setConfirm(null)}
                    onConfirm={() => handleDelete(confirm)}
                />
            )}
        </div>
    );
}

// Max chips inline before collapsing the rest into a "+N more" pill. Mirrors
// the treatment Manage Courses uses for its Colleges column.
const MAX_VISIBLE_COLLEGES = 2;

function CourseChips({ courseIds, titleById }) {
    const ids = Array.isArray(courseIds) ? courseIds.filter((v) => v !== null && v !== undefined && v !== '') : [];
    if (ids.length === 0) {
        return <span className="text-[11px] text-muted">No course</span>;
    }
    const visible = ids.slice(0, MAX_VISIBLE_COLLEGES);
    const hiddenCount = ids.length - visible.length;
    const hiddenLabel = ids
        .slice(MAX_VISIBLE_COLLEGES)
        .map((id) => titleById[String(id)] || `#${id}`)
        .join(', ');
    return (
        <>
        {/* Print: full comma-separated list so the PDF includes every course. */}
        <span className="hidden print:inline text-[11px]">
            {ids.map((id) => titleById[String(id)] || `#${id}`).join(', ')}
        </span>
        <div className="flex flex-wrap items-center gap-1 print:hidden">
            {visible.map((id) => {
                const title = titleById[String(id)] || `#${id}`;
                return (
                    <span
                        key={id}
                        className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[11px] max-w-[160px] truncate"
                        title={title}
                    >
                        {title}
                    </span>
                );
            })}
            {hiddenCount > 0 && (
                <span
                    className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-[11px]"
                    title={hiddenLabel}
                >
                    +{hiddenCount} more
                </span>
            )}
        </div>
        </>
    );
}

function CollegeChips({ clgIds, nameById }) {
    const ids = Array.isArray(clgIds) ? clgIds.filter(Boolean) : [];
    if (ids.length === 0) {
        return <span className="text-[11px] text-muted">No colleges assigned</span>;
    }
    const visible = ids.slice(0, MAX_VISIBLE_COLLEGES);
    const hiddenCount = ids.length - visible.length;
    const hiddenLabel = ids
        .slice(MAX_VISIBLE_COLLEGES)
        .map((id) => nameById[id] || id)
        .join(', ');
    return (
        <>
        {/* Print: full comma-separated list so the PDF includes every college. */}
        <span className="hidden print:inline text-[11px]">
            {ids.map((id) => nameById[id] || id).join(', ')}
        </span>
        <div className="flex flex-wrap items-center gap-1 print:hidden">
            {visible.map((id) => (
                <span
                    key={id}
                    className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[11px] max-w-[120px] truncate"
                    title={nameById[id] || id}
                >
                    {nameById[id] || id}
                </span>
            ))}
            {hiddenCount > 0 && (
                <span
                    className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-[11px]"
                    title={hiddenLabel}
                >
                    +{hiddenCount} more
                </span>
            )}
        </div>
        </>
    );
}

// Export menu (PDF / Print). Both trigger window.print(); the @media print CSS
// (index.css) renders only the table — all columns except Options — in landscape.
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
                <ul className="absolute right-0 z-20 mt-1 min-w-[160px] bg-white border border-border rounded-ol-8 shadow-lg py-1 text-[13px]">
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

// Three-dot menu (Edit / Delete). Same portal + positioning approach as the
// Manage Courses OptionsDropdown so the menu survives the overflow-x-auto
// container on the table and stays visible past row boundaries. Closes on
// outside click, Escape, scroll, or resize.
function OptionsDropdown({ onEdit, onDelete }) {
    const [open, setOpen] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const triggerRef = useRef(null);
    const menuRef = useRef(null);

    useEffect(() => {
        if (!open) return;
        const el = triggerRef.current;
        if (el) {
            const rect = el.getBoundingClientRect();
            const MENU_WIDTH = 160;
            // Two items × ~36px + padding. Real height isn't known until paint,
            // but this is enough to decide whether to flip up.
            const ESTIMATED_MENU_HEIGHT = 96;
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
        const onDocClick = (e) => {
            if (triggerRef.current?.contains(e.target)) return;
            if (menuRef.current?.contains(e.target)) return;
            setOpen(false);
        };
        const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
        const onScroll = () => setOpen(false);
        const onResize = () => setOpen(false);
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
                    className="z-[1000] min-w-[160px] bg-white border border-border rounded-ol-8 shadow-lg py-1 text-[13px]"
                >
                    <li>
                        <button
                            type="button"
                            className="w-full text-left block px-3 py-2 text-dark hover:bg-gray-50"
                            onClick={() => { close(); onEdit(); }}
                        >
                            Edit
                        </button>
                    </li>
                    <li>
                        <button
                            type="button"
                            className="w-full text-left block px-3 py-2 text-danger hover:bg-gray-50"
                            onClick={() => { close(); onDelete(); }}
                        >
                            Delete
                        </button>
                    </li>
                </ul>,
                document.body,
            )}
        </div>
    );
}
