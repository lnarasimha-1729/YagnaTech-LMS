import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import ConfirmDialog from '../../components/ConfirmDialog';
import { listAdmins, deleteAdmin } from '../../api/admin';
import { BsThreeDotsVertical } from 'react-icons/bs';

const API = import.meta.env.VITE_ADMIN_API_URL || 'http://localhost:4000';

const avatarUrl = (row) => row.photo
    ? `${API}/${row.photo}`
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(row.name || row.email || 'A')}&background=169f48&color=fff`;

export default function AdminIndex() {
    const [params, setParams] = useSearchParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [confirm, setConfirm] = useState(null);

    const query = Object.fromEntries(params.entries());

    const load = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await listAdmins(query);
            setData(res);
        } catch (err) {
            setError(err?.response?.data?.error || err?.message || 'Failed to load admins');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); /* eslint-disable-next-line */ }, [params]);

    const onSearch = (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const term = (fd.get('search') || '').toString().trim();
        const next = { ...query };
        if (term) next.search = term; else delete next.search;
        setParams(next);
    };

    const handleDelete = async (id) => {
        try {
            await deleteAdmin(id);
            toast.success('Admin deleted successfully');
            setConfirm(null);
            load();
        } catch (e) {
            toast.error(e.response?.data?.error || 'Failed');
            setConfirm(null);
        }
    };

    const handlePrint = () => window.print();

    if (loading && !data) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-gray">
                <div className="w-10 h-10 border-4 border-gray-200 border-t-skin rounded-full animate-spin mb-3" />
                <p className="text-[14px]">Loading admins…</p>
            </div>
        );
    }

    if (error && !data) {
        return (
            <div className="ol-card rounded-ol-8">
                <div className="ol-card-body py-10 px-6 text-center">
                    <p className="text-[16px] font-semibold text-danger mb-2">Couldn’t load admins</p>
                    <p className="text-[13px] text-gray mb-4">{error}</p>
                    <button className="ol-btn-primary" onClick={load}>Retry</button>
                </div>
            </div>
        );
    }

    const rows = data.admins || [];
    const isEmpty = rows.length === 0;

    return (
        <div>
            <div className="ol-card rounded-ol-8 mb-3">
                <div className="ol-card-body py-12px px-20px my-3">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <h4 className="text-[16px] font-semibold text-dark m-0 flex items-center gap-2">
                            <i className="fi-rr-settings-sliders" />
                            Admin List
                        </h4>
                        <Link
                            to="/admin/admins/create"
                            className="ol-btn-outline-secondary flex items-center gap-10px"
                        >
                            <span className="fi-rr-plus" />
                            <span>Add new Admin</span>
                        </Link>
                    </div>
                </div>
            </div>

            <div className="ol-card p-3">
                <div className="ol-card-body">
                    <div className="grid grid-cols-12 gap-3 mb-3 mt-3 items-center">
                        <div className="col-span-12 md:col-span-6">
                            <ExportDropdown onPdf={handlePrint} onPrint={handlePrint} />
                        </div>
                        <div className="col-span-12 md:col-span-6">
                            <form onSubmit={onSearch} className="grid grid-cols-12 gap-3">
                                <div className="col-span-12 md:col-span-9">
                                    <input
                                        className="ol-form-control w-full"
                                        name="search"
                                        type="text"
                                        placeholder="Search user"
                                        defaultValue={query.search || ''}
                                    />
                                </div>
                                <div className="col-span-12 md:col-span-3">
                                    <button type="submit" className="ol-btn-primary w-full">Search</button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {isEmpty ? (
                        <div className="py-12 text-center border border-dashed border-border rounded-ol-8">
                            <p className="text-[16px] font-semibold text-dark mb-1">No admins found</p>
                            <p className="text-[13px] text-gray">Try adjusting your search or add a new admin.</p>
                        </div>
                    ) : (
                        <>
                            <div className="flex justify-between items-center flex-wrap gap-3 mb-3">
                                <p className="text-gray text-[14px] m-0">
                                    Showing {rows.length} of {data.total} data
                                </p>
                                {loading && <span className="text-[12px] text-gray">Refreshing…</span>}
                            </div>
                            <div className="overflow-x-auto">
                                <table className="e-table">
                                    <thead>
                                        <tr>
                                            <th scope="col">#</th>
                                            <th scope="col">Name</th>
                                            <th scope="col">Phone</th>
                                            <th scope="col">College Name</th>
                                            <th scope="col">Options</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows.map((a, i) => (
                                            <tr key={a.id}>
                                                <td>{((data.page || 1) - 1) * (data.per_page || rows.length) + i + 1}</td>
                                                <td className="min-w-[200px]">
                                                    <div className="flex items-center gap-2">
                                                        <img
                                                            src={avatarUrl(a)}
                                                            className="w-[45px] h-[45px] rounded-full object-cover"
                                                            alt=""
                                                        />
                                                        <div>
                                                            <h4 className="text-[14px] font-semibold text-dark m-0">{a.name}</h4>
                                                            <p className="text-[12px] text-gray m-0">{a.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td><p className="m-0">{a.phone || '-'}</p></td>
                                                <td>
                                                    <p className="m-0 text-dark">
                                                        {a.college_name || <span className="text-gray">College Name</span>}
                                                    </p>
                                                </td>
                                                <td>
                                                    {/* Root admin used to show a "Root Admin" pill in place of the
                                                        three-dot menu, which broke row-action consistency. Now every
                                                        row gets the dots; the root row's dropdown just hides Delete
                                                        (the backend refuses it anyway — see AdminService.remove). */}
                                                    <AdminOptions
                                                        admin={a}
                                                        onDelete={() => setConfirm({ id: a.id, name: a.name })}
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {confirm && (
                <ConfirmDialog
                    title="Delete admin"
                    message={`Are you sure you want to delete ${confirm.name}?`}
                    onCancel={() => setConfirm(null)}
                    onConfirm={() => handleDelete(confirm.id)}
                />
            )}
        </div>
    );
}

function AdminOptions({ admin, onDelete }) {
    const [open, setOpen] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const triggerRef = useRef(null);
    const menuRef = useRef(null);
    const MENU_WIDTH = 180;
    const ESTIMATED_MENU_HEIGHT = 140;

    useEffect(() => {
        if (!open) return;
        const el = triggerRef.current;
        if (el) {
            const rect = el.getBoundingClientRect();
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
        const onDoc = (e) => {
            if (triggerRef.current?.contains(e.target)) return;
            if (menuRef.current?.contains(e.target)) return;
            setOpen(false);
        };
        const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
        const onScroll = () => setOpen(false);
        const onResize = () => setOpen(false);
        window.addEventListener('scroll', onScroll, true);
        window.addEventListener('resize', onResize);
        document.addEventListener('mousedown', onDoc);
        document.addEventListener('keydown', onKey);
        return () => {
            window.removeEventListener('scroll', onScroll, true);
            window.removeEventListener('resize', onResize);
            document.removeEventListener('mousedown', onDoc);
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
                    style={{ position: 'fixed', top: coords.top, left: coords.left, width: MENU_WIDTH }}
                    className="z-[1000] bg-white border border-border rounded-ol-8 shadow-lg py-1 text-[13px]"
                >
                    <li>
                        <Link
                            to={`/admin/admins/edit/${admin.id}`}
                            className="block px-3 py-2 text-dark hover:bg-gray-50"
                            onClick={close}
                        >
                            Edit
                        </Link>
                    </li>
                    {!admin.is_root_admin && (
                        <li>
                            <button
                                type="button"
                                className="w-full text-left block px-3 py-2 text-danger hover:bg-gray-50"
                                onClick={() => { close(); onDelete(); }}
                            >
                                Delete
                            </button>
                        </li>
                    )}
                </ul>,
                document.body,
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
        <div className="relative inline-block" ref={ref}>
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
