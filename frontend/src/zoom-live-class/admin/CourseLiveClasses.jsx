import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-toastify';
import { BsThreeDotsVertical } from 'react-icons/bs';
import Modal from '@/admin/components/Modal';
import ConfirmDialog from '@/admin/components/ConfirmDialog';
import { API_BASE } from '@/admin/api/client';
import { listLiveClasses, deleteLiveClass, resolveJoin, syncStatus } from './liveClassApi';
import CourseLiveClassForm from './CourseLiveClassForm';

/**
 * Zoom Live Class management — body of the "Live Class" tab inside Edit Course.
 *
 * Faithful port of lms-cp/mern-lineclass/.../CourseLiveClasses.jsx — uses the
 * same table layout, status pills, icon actions, and host-avatar cell — but
 * built with the admin-service's existing components (Modal, ConfirmDialog,
 * react-toastify, ol-* Tailwind classes) instead of react-hot-toast / useApi /
 * useSettings, which this codebase does not use.
 *
 * Auto-syncs each class's status with the Zoom API every 60s so the "Live now"
 * badge flips automatically while the tab is open.
 */

const STATUS_POLL_MS = 60_000;

const STATUS_LABEL = {
    scheduled: 'Scheduled',
    live: 'Live now',
    started: 'Live now',
    completed: 'Completed',
    finished: 'Completed',
    unavailable: 'Unavailable',
    waiting: 'Scheduled',
};

const STATUS_CLS = {
    scheduled: 'bg-gray-100 text-gray-700',
    waiting: 'bg-gray-100 text-gray-700',
    live: 'bg-red-50 text-red-600',
    started: 'bg-red-50 text-red-600',
    completed: 'bg-gray-100 text-gray-500',
    finished: 'bg-gray-100 text-gray-500',
    unavailable: 'bg-gray-100 text-gray-500',
};

const fmtDate = (s) => {
    if (!s) return '';
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return s;
    return d.toLocaleString(undefined, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

// Resolve a host photo path the same way the rest of admin pages do — prepend
// API_BASE for relative upload paths, leave absolute URLs alone.
const photoUrl = (path) => {
    if (!path) return null;
    if (/^https?:\/\//i.test(path)) return path;
    return `${API_BASE}/${path.replace(/^\/+/, '')}`;
};

const HostCell = ({ host }) => {
    if (!host) return <span className="text-gray text-[13px]">—</span>;
    const initials = (host.name || host.email || 'U')
        .split(/\s+/)
        .map((s) => s[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase();
    const url = photoUrl(host.photo);
    return (
        <div className="flex items-center gap-2">
            {url ? (
                <img
                    src={url}
                    alt={host.name || ''}
                    className="rounded-full object-cover"
                    style={{ width: 36, height: 36 }}
                />
            ) : (
                <span
                    className="w-9 h-9 rounded-full bg-lightgreen text-skin text-[12px] font-semibold flex items-center justify-center"
                    aria-hidden
                >
                    {initials}
                </span>
            )}
            <div className="min-w-0">
                <div className="text-[13px] font-semibold text-dark truncate">{host.name}</div>
                {host.email && <div className="text-[11px] text-gray truncate">{host.email}</div>}
            </div>
        </div>
    );
};

const StatusBadge = ({ status }) => {
    const cls = STATUS_CLS[status] || STATUS_CLS.scheduled;
    const label = STATUS_LABEL[status] || STATUS_LABEL.scheduled;
    const isLive = status === 'live' || status === 'started';
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium ${cls}`}>
            {isLive && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
            {label}
        </span>
    );
};

// Row action menu — a 3-vertical-dots kebab that opens Start / Edit / Delete.
//
// Matches the dropdown behaviour of the other admin list pages (Courses,
// Students, Coupons …): the menu is portal-rendered at `position: fixed`
// coords so the table's `overflow-x-auto` can't clip it, and it closes on
// outside-click, Escape, or scroll/resize.
const ActionsMenu = ({ liveClass, completed, joining, onStart, onEdit, onDelete }) => {
    const [open, setOpen] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const triggerRef = useRef(null);
    const menuRef = useRef(null);

    useEffect(() => {
        if (!open) return undefined;
        const el = triggerRef.current;
        if (el) {
            const rect = el.getBoundingClientRect();
            const MENU_WIDTH = 180;
            const ESTIMATED_MENU_HEIGHT = 140; // 3 items × ~44px + padding
            const GAP = 4;

            // Right-align the menu under the trigger, clamped to the viewport.
            let left = rect.right - MENU_WIDTH;
            if (left < 8) left = 8;
            if (left + MENU_WIDTH > window.innerWidth - 8) {
                left = window.innerWidth - MENU_WIDTH - 8;
            }

            // Open below by default; flip above when there isn't room.
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

    const run = (fn) => () => { setOpen(false); fn(); };

    return (
        <div className="relative inline-block text-left">
            <button
                ref={triggerRef}
                type="button"
                onClick={() => setOpen((o) => !o)}
                title="Actions"
                aria-label="Actions"
                aria-haspopup="menu"
                aria-expanded={open}
                className="inline-flex items-center justify-center w-8 h-8 rounded-ol-8 border border-border text-gray hover:border-skin hover:text-skin"
            >
                <BsThreeDotsVertical className="text-[16px]" />
            </button>
            {open && createPortal(
                <ul
                    ref={menuRef}
                    role="menu"
                    style={{ position: 'fixed', top: coords.top, left: coords.left }}
                    className="z-[1000] min-w-[180px] bg-white border border-border rounded-ol-8 shadow-lg py-1 text-[13px]"
                >
                    <li>
                        <button
                            type="button"
                            role="menuitem"
                            onClick={run(() => onStart(liveClass.id))}
                            disabled={completed || joining}
                            className="w-full flex items-center gap-2 px-3 py-2 text-left text-skin hover:bg-lightgreen disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {joining ? (
                                <i className="fa fa-spinner fa-spin" />
                            ) : (
                                <span className="fi-rr-video-camera" />
                            )}
                            <span>{completed ? 'Class ended' : 'Start live class'}</span>
                        </button>
                    </li>
                    <li>
                        <button
                            type="button"
                            role="menuitem"
                            onClick={run(() => onEdit(liveClass))}
                            className="w-full flex items-center gap-2 px-3 py-2 text-left text-dark hover:bg-gray-50"
                        >
                            <span className="fi-rr-pencil" />
                            <span>Edit</span>
                        </button>
                    </li>
                    <li>
                        <button
                            type="button"
                            role="menuitem"
                            onClick={run(() => onDelete(liveClass))}
                            className="w-full flex items-center gap-2 px-3 py-2 text-left text-danger hover:bg-red-50"
                        >
                            <span className="fi-rr-trash" />
                            <span>Delete</span>
                        </button>
                    </li>
                </ul>,
                document.body
            )}
        </div>
    );
};

export default function CourseLiveClasses({ course }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(null);
    const [confirm, setConfirm] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [joiningId, setJoiningId] = useState(null);

    const load = async () => {
        setLoading(true);
        try {
            const r = await listLiveClasses(course.id);
            setItems(r.live_classes || []);
        } catch (e) {
            toast.error(e.response?.data?.error || 'Failed to load live classes');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, [course.id]);

    // Live status sync — every 60s, hit /zoom-live-class/:id/status for any
    // class that isn't already completed so the badge flips automatically.
    useEffect(() => {
        if (!items.length) return undefined;
        const trackable = items.filter(
            (c) => c.status !== 'completed' && c.status !== 'finished'
        );
        if (!trackable.length) return undefined;

        let cancelled = false;
        const tick = async () => {
            for (const lc of trackable) {
                try {
                    const r = await syncStatus(lc.id);
                    if (cancelled || !r?.status) continue;
                    setItems((prev) =>
                        prev.map((p) => (p.id === lc.id ? { ...p, status: r.status } : p))
                    );
                } catch {
                    // Ignore — schedule-derived status remains.
                }
            }
        };
        tick();
        const handle = setInterval(tick, STATUS_POLL_MS);
        return () => { cancelled = true; clearInterval(handle); };
    }, [items.length]);

    const handleDelete = async () => {
        if (!confirm) return;
        setDeleting(true);
        try {
            await deleteLiveClass(confirm.id);
            toast.success('Live class deleted successfully');
            setConfirm(null);
            load();
        } catch (e) {
            toast.error(e.response?.data?.error || 'Failed');
        } finally {
            setDeleting(false);
        }
    };

    const handleStart = async (id) => {
        if (joiningId) return;
        setJoiningId(id);
        try {
            const r = await resolveJoin(id);
            if (r.mode === 'redirect' && r.url) {
                window.open(r.url, '_blank', 'noopener');
            } else if (r.mode === 'web-sdk') {
                window.open(
                    `/courses/programs/course-details/play/${course.slug}/live-class/${id}`,
                    '_blank',
                    'noopener'
                );
            } else {
                toast.error(r.reason || 'Live class is not available right now');
            }
        } catch (e) {
            toast.error(e.response?.data?.error || 'Failed to start');
        } finally {
            setJoiningId(null);
        }
    };

    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <div>
                    <h5 className="text-[16px] font-semibold text-dark m-0">Live Classes</h5>
                    <p className="text-[12px] text-gray m-0">
                        Schedule and manage Zoom live sessions for this course.
                    </p>
                </div>
                <button
                    type="button"
                    className="ol-btn-primary ol-btn-sm inline-flex items-center gap-1"
                    onClick={() => setModal({ type: 'add' })}
                >
                    <span className="fi-rr-plus" />
                    Schedule a new live class
                </button>
            </div>

            {loading ? (
                <div className="text-center py-10 text-[14px] text-gray">Loading…</div>
            ) : items.length === 0 ? (
                <div className="text-center py-10 text-[14px] text-gray border border-dashed border-border rounded-ol-12">
                    No live classes yet.
                </div>
            ) : (
                <div className="overflow-x-auto border border-ebordermuted rounded-ol-12">
                    <table className="w-full text-[13px]">
                        <thead className="bg-gray-50 text-gray uppercase tracking-wide text-[11px]">
                            <tr>
                                <th className="text-left py-3 px-4 font-semibold">Instructor</th>
                                <th className="text-left py-3 px-4 font-semibold">Class topic</th>
                                <th className="text-left py-3 px-4 font-semibold">Class schedule</th>
                                <th className="text-left py-3 px-4 font-semibold">Status</th>
                                <th className="text-right py-3 px-4 font-semibold">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((c) => {
                                const completed = c.status === 'completed' || c.status === 'finished';
                                return (
                                    <tr key={c.id} className="border-t border-ebordermuted hover:bg-gray-50/60">
                                        <td className="py-3 px-4">
                                            <HostCell host={c.host} />
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="text-dark font-medium">{c.class_topic}</div>
                                            {c.note && (
                                                <div className="text-[11px] text-gray line-clamp-1 max-w-[260px]">
                                                    {c.note}
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-3 px-4 text-gray-700 whitespace-nowrap">
                                            {fmtDate(c.class_date_and_time)}
                                        </td>
                                        <td className="py-3 px-4">
                                            <StatusBadge status={c.status} />
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center justify-end">
                                                <ActionsMenu
                                                    liveClass={c}
                                                    completed={completed}
                                                    joining={joiningId === c.id}
                                                    onStart={handleStart}
                                                    onEdit={(lc) => setModal({ type: 'edit', liveClass: lc })}
                                                    onDelete={(lc) => setConfirm({ id: lc.id, label: lc.class_topic })}
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {modal?.type === 'add' && (
                <Modal title="Schedule a new live class" onClose={() => setModal(null)} size="lg">
                    <CourseLiveClassForm
                        course={course}
                        onCancel={() => setModal(null)}
                        onDone={() => {
                            toast.success('Live class added successfully');
                            setModal(null);
                            load();
                        }}
                    />
                </Modal>
            )}
            {modal?.type === 'edit' && (
                <Modal title="Edit live class" onClose={() => setModal(null)} size="lg">
                    <CourseLiveClassForm
                        course={course}
                        liveClass={modal.liveClass}
                        onCancel={() => setModal(null)}
                        onDone={() => {
                            toast.success('Live class updated successfully');
                            setModal(null);
                            load();
                        }}
                    />
                </Modal>
            )}
            {confirm && (
                <ConfirmDialog
                    title="Delete live class"
                    message={
                        deleting
                            ? 'Deleting…'
                            : `Are you sure you want to delete "${confirm.label}"?`
                    }
                    onCancel={() => (deleting ? null : setConfirm(null))}
                    onConfirm={handleDelete}
                />
            )}
        </div>
    );
}
