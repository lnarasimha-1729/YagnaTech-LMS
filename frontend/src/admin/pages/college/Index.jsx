import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import ConfirmDialog from '../../components/ConfirmDialog';
import { listColleges, deleteCollege, setCollegeAccess } from '../../api/college';
import { BsThreeDotsVertical } from 'react-icons/bs';

export default function CollegeIndex() {
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
            const res = await listColleges(query);
            setData(res);
        } catch (err) {
            setError(err?.response?.data?.error || err?.message || 'Failed to load colleges');
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
            await deleteCollege(id);
            toast.success('College deleted successfully');
            setConfirm(null);
            load();
        } catch (e) {
            toast.error(e.response?.data?.error || 'Failed');
            setConfirm(null);
        }
    };

    const handleSetAccess = async (id, isActive) => {
        try {
            await setCollegeAccess(id, isActive);
            toast.success(isActive ? 'Access granted' : 'Access revoked');
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
                <p className="text-[14px]">Loading colleges…</p>
            </div>
        );
    }

    if (error && !data) {
        return (
            <div className="ol-card rounded-ol-8">
                <div className="ol-card-body py-10 px-6 text-center">
                    <p className="text-[16px] font-semibold text-danger mb-2">Couldn’t load colleges</p>
                    <p className="text-[13px] text-gray mb-4">{error}</p>
                    <button className="ol-btn-primary" onClick={load}>Retry</button>
                </div>
            </div>
        );
    }

    const rows = data.colleges || [];
    const isEmpty = rows.length === 0;

    return (
        <div>
            <div className="ol-card rounded-ol-8 mb-3">
                <div className="ol-card-body py-12px px-20px my-3">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <h4 className="text-[16px] font-semibold text-dark m-0 flex items-center gap-2">
                            <i className="fi-rr-settings-sliders" />
                            College List
                        </h4>
                        <Link
                            to="/admin/colleges/create"
                            className="ol-btn-outline-secondary flex items-center gap-10px"
                        >
                            <span className="fi-rr-plus" />
                            <span>Add new College</span>
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
                                        placeholder="Search college name or ID"
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
                            <p className="text-[16px] font-semibold text-dark mb-1">No colleges found</p>
                            <p className="text-[13px] text-gray">Try adjusting your search or add a new college.</p>
                        </div>
                    ) : (
                        <>
                            <div className="flex justify-between items-center flex-wrap gap-3 mb-3">
                                <p className="text-gray text-[14px] m-0">
                                    Showing {rows.length} of {data.total} data
                                </p>
                                {loading && <span className="text-[12px] text-gray">Refreshing…</span>}
                            </div>
                            <div className="overflow-x-auto e-table-scroll-y print-area">
                                <table className="e-table">
                                    <thead>
                                        <tr>
                                            <th scope="col">#</th>
                                            <th scope="col">College Name</th>
                                            <th scope="col">College ID</th>
                                            <th scope="col">YAG ID</th>
                                            <th scope="col">Active Batches</th>
                                            <th scope="col" className="no-print">Options</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows.map((c, i) => (
                                            <tr key={c.clgId}>
                                                <td>{((data.page || 1) - 1) * (data.per_page || rows.length) + i + 1}</td>
                                                <td>
                                                    <h4 className="text-[14px] font-semibold text-dark m-0">{c.clgName}</h4>
                                                    {c.clgAddress && (
                                                        <p className="text-[12px] text-gray m-0">{c.clgAddress}</p>
                                                    )}
                                                </td>
                                                <td>
                                                    <p className="m-0 text-dark">{c.clgId}</p>
                                                </td>
                                                <td>
                                                    {c.yagId
                                                        ? <span className="font-semibold text-skin tracking-wide">{c.yagId}</span>
                                                        : <span className="text-gray">—</span>}
                                                </td>
                                                <td>
                                                    <span className="inline-block px-2 py-0.5 rounded text-[12px] font-semibold bg-skin/10 text-skin">
                                                        {c.batches_count ?? 0}
                                                    </span>
                                                </td>
                                                <td className="no-print">
                                                    <CollegeOptions
                                                        college={c}
                                                        onDelete={() => setConfirm({ type: 'delete', id: c.clgId, name: c.clgName })}
                                                        onRevoke={() => setConfirm({ type: 'revoke', id: c.clgId, name: c.clgName })}
                                                        onGive={() => setConfirm({ type: 'give', id: c.clgId, name: c.clgName })}
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
                    message={
                        confirm.type === 'revoke'
                            ? `Revoke access for ${confirm.name}? The college admin will lose access until you grant it again.`
                            : confirm.type === 'give'
                                ? `Grant access for ${confirm.name}?`
                                : `Are you sure you want to delete ${confirm.name}?`
                    }
                    onCancel={() => setConfirm(null)}
                    onConfirm={() => {
                        if (confirm.type === 'revoke') return handleSetAccess(confirm.id, false);
                        if (confirm.type === 'give') return handleSetAccess(confirm.id, true);
                        return handleDelete(confirm.id);
                    }}
                />
            )}
        </div>
    );
}

function CollegeOptions({ college, onDelete, onRevoke, onGive }) {
    const [open, setOpen] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const triggerRef = useRef(null);
    const menuRef = useRef(null);
    const MENU_WIDTH = 180;
    const ESTIMATED_MENU_HEIGHT = 170;

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
                            to={`/admin/colleges/edit/${encodeURIComponent(college.clgId)}`}
                            className="block px-3 py-2 text-dark hover:bg-gray-50"
                            onClick={close}
                        >
                            Edit
                        </Link>
                    </li>
                    {college.isActive === false ? (
                        <li>
                            <button
                                type="button"
                                className="w-full text-left block px-3 py-2 text-success hover:bg-gray-50"
                                onClick={() => { close(); onGive(); }}
                            >
                                Give Access
                            </button>
                        </li>
                    ) : (
                        <li>
                            <button
                                type="button"
                                className="w-full text-left block px-3 py-2 text-danger hover:bg-gray-50"
                                onClick={() => { close(); onRevoke(); }}
                            >
                                Revoke Access
                            </button>
                        </li>
                    )}
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
