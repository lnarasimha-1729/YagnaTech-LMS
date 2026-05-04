import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import ConfirmDialog from '../../components/ConfirmDialog';
import Modal from '../../components/Modal';
import {
    listCoupons, storeCoupon, updateCoupon, deleteCoupon, toggleCouponStatus, getCoupon,
} from '../../api/coupon';
import { BsThreeDotsVertical } from 'react-icons/bs';

const formatExpiry = (unix) => {
    if (!unix) return '-';
    const d = new Date(Number(unix) * 1000);
    if (Number.isNaN(d.getTime())) return '-';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = d.toLocaleString('en-US', { month: 'short' });
    const yy = d.getFullYear();
    return `${dd}-${mm}-${yy}`;
};

const toInputDate = (unix) => {
    if (!unix) return '';
    const d = new Date(Number(unix) * 1000);
    if (Number.isNaN(d.getTime())) return '';
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`;
};

export default function CouponIndex() {
    const [params, setParams] = useSearchParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [addOpen, setAddOpen] = useState(false);
    const [editCoupon, setEditCoupon] = useState(null);
    const [confirm, setConfirm] = useState(null);

    const query = Object.fromEntries(params.entries());

    const load = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await listCoupons(query);
            setData(res);
        } catch (err) {
            setError(err?.response?.data?.error || 'Failed to load coupons');
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
            await deleteCoupon(id);
            toast.success('Coupon deleted successfully');
            setConfirm(null);
            load();
        } catch (e) {
            toast.error(e.response?.data?.error || 'Failed');
            setConfirm(null);
        }
    };

    const handleToggle = async (id) => {
        try {
            await toggleCouponStatus(id);
            toast.success('Status has been updated');
            load();
        } catch (e) {
            toast.error(e.response?.data?.error || 'Failed');
        }
    };

    const openEdit = async (id) => {
        try {
            const res = await getCoupon(id);
            setEditCoupon(res.coupon);
        } catch (e) {
            toast.error(e.response?.data?.error || 'Failed to load coupon');
        }
    };

    const handlePrint = () => window.print();

    if (loading && !data) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-gray">
                <div className="w-10 h-10 border-4 border-gray-200 border-t-skin rounded-full animate-spin mb-3" />
                <p className="text-[14px]">Loading coupons…</p>
            </div>
        );
    }

    if (error && !data) {
        return (
            <div className="ol-card rounded-ol-8">
                <div className="ol-card-body py-10 px-6 text-center">
                    <p className="text-[16px] font-semibold text-danger mb-2">Couldn’t load coupons</p>
                    <p className="text-[13px] text-gray mb-4">{error}</p>
                    <button className="ol-btn-primary" onClick={load}>Retry</button>
                </div>
            </div>
        );
    }

    const rows = data.coupons.data;
    const isEmpty = rows.length === 0;

    return (
        <div>
            <div className="ol-card rounded-ol-8 mb-3">
                <div className="ol-card-body py-12px px-20px my-3">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <h4 className="text-[16px] font-semibold text-dark m-0 flex items-center gap-2">
                            <i className="fi-rr-settings-sliders" />
                            Coupon
                        </h4>
                        <button
                            type="button"
                            className="ol-btn-outline-secondary flex items-center gap-10px"
                            onClick={() => setAddOpen(true)}
                        >
                            <span className="fi-rr-plus" />
                            <span>Add Coupon</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="ol-card">
                <div className="ol-card-body p-3">
                    <div className="grid grid-cols-12 gap-3 mb-3 mt-3 items-center">
                        <div className="col-span-12 md:col-span-6">
                            <ExportDropdown onPdf={handlePrint} onPrint={handlePrint} />
                        </div>
                        <div className="col-span-12 md:col-span-6">
                            <form onSubmit={onSearch} className="flex justify-end gap-3">
                                <input
                                    className="ol-form-control flex-grow"
                                    name="search"
                                    type="text"
                                    placeholder="Search coupon"
                                    defaultValue={query.search || ''}
                                />
                                <button type="submit" className="ol-btn-primary">Search</button>
                            </form>
                        </div>
                    </div>

                    {isEmpty ? (
                        <div className="py-12 text-center border border-dashed border-border rounded-ol-8">
                            <p className="text-[16px] font-semibold text-dark mb-1">No coupons found</p>
                            <p className="text-[13px] text-gray">Try adjusting your search or add a new coupon.</p>
                        </div>
                    ) : (
                        <>
                            <div className="flex justify-between items-center flex-wrap gap-3 mb-3">
                                <p className="text-gray text-[14px] m-0">
                                    Showing {rows.length} of {data.coupons.total} data
                                </p>
                                {loading && <span className="text-[12px] text-gray">Refreshing…</span>}
                            </div>
                            <div className="overflow-x-auto">
                                <table className="e-table">
                                    <thead>
                                        <tr>
                                            <th scope="col">#</th>
                                            <th scope="col">Coupon code</th>
                                            <th scope="col">Discount</th>
                                            <th scope="col">Expiry</th>
                                            <th scope="col">Status</th>
                                            <th scope="col">Options</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows.map((c, i) => (
                                            <tr key={c.id}>
                                                <td>{(data.coupons.current_page - 1) * data.coupons.per_page + i + 1}</td>
                                                <td className="min-w-[180px]">
                                                    <h4 className="text-[14px] font-semibold text-dark m-0">{c.code}</h4>
                                                </td>
                                                <td>{c.discount} %</td>
                                                <td>{formatExpiry(c.expiry)}</td>
                                                <td>
                                                    <span className={`inline-block px-2 py-1 rounded-ol-8 text-[11px] font-semibold ${
                                                        c.status ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                    }`}>
                                                        {c.status ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <CouponOptions
                                                        coupon={c}
                                                        onToggle={() => handleToggle(c.id)}
                                                        onEdit={() => openEdit(c.id)}
                                                        onDelete={() => setConfirm(c.id)}
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <Pagination
                                total={data.coupons.last_page}
                                current={data.coupons.current_page}
                                onPage={(p) => setParams({ ...query, page: p })}
                            />
                        </>
                    )}
                </div>
            </div>

            {addOpen && (
                <Modal title="Add Coupon" size="md" onClose={() => setAddOpen(false)}>
                    <CouponForm
                        submitLabel="Add coupon"
                        onSubmit={async (body) => {
                            try {
                                await storeCoupon(body);
                                toast.success('Coupon has been created successfully.');
                                setAddOpen(false);
                                load();
                            } catch (e) {
                                toast.error(e.response?.data?.error || 'Failed');
                            }
                        }}
                    />
                </Modal>
            )}

            {editCoupon && (
                <Modal title="Edit Coupon" size="md" onClose={() => setEditCoupon(null)}>
                    <CouponForm
                        initial={editCoupon}
                        submitLabel="Update coupon"
                        onSubmit={async (body) => {
                            try {
                                await updateCoupon(editCoupon.id, body);
                                toast.success('Coupon has been updated successfully.');
                                setEditCoupon(null);
                                load();
                            } catch (e) {
                                toast.error(e.response?.data?.error || 'Failed');
                            }
                        }}
                    />
                </Modal>
            )}

            {confirm && (
                <ConfirmDialog
                    message="Delete this coupon?"
                    onCancel={() => setConfirm(null)}
                    onConfirm={() => handleDelete(confirm)}
                />
            )}
        </div>
    );
}

function CouponForm({ initial, onSubmit, submitLabel }) {
    const [form, setForm] = useState({
        code: initial?.code || '',
        discount: initial?.discount ?? '',
        expiry: toInputDate(initial?.expiry) || '',
        status: initial?.status === undefined ? '' : String(initial.status),
    });
    const [submitting, setSubmitting] = useState(false);

    const set = (k, v) => setForm((s) => ({ ...s, [k]: v }));

    const submit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await onSubmit(form);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={submit}>
            <div className="mb-3">
                <label className="ol-form-label" htmlFor="code">Code</label>
                <input
                    id="code"
                    className="ol-form-control"
                    name="code"
                    type="text"
                    placeholder="Enter coupon code"
                    required
                    value={form.code}
                    onChange={(e) => set('code', e.target.value)}
                />
            </div>

            <div className="mb-3">
                <label className="ol-form-label" htmlFor="discount">Discount (%)</label>
                <input
                    id="discount"
                    className="ol-form-control"
                    name="discount"
                    type="number"
                    placeholder="Enter coupon discount"
                    min="0"
                    max="100"
                    required
                    value={form.discount}
                    onChange={(e) => set('discount', e.target.value)}
                />
            </div>

            <div className="mb-3">
                <label className="ol-form-label" htmlFor="expiry">Expiry</label>
                <input
                    id="expiry"
                    className="ol-form-control"
                    name="expiry"
                    type="date"
                    required
                    value={form.expiry}
                    onChange={(e) => set('expiry', e.target.value)}
                />
            </div>

            <div className="mb-3">
                <label className="ol-form-label" htmlFor="status">Status</label>
                <select
                    id="status"
                    className="ol-form-control"
                    name="status"
                    required
                    value={form.status}
                    onChange={(e) => set('status', e.target.value)}
                >
                    <option value="">Choose status ...</option>
                    <option value="1">Active</option>
                    <option value="0">Inactive</option>
                </select>
            </div>

            <div className="flex justify-end">
                <button type="submit" className="ol-btn-primary" disabled={submitting}>
                    {submitting ? 'Saving…' : submitLabel}
                </button>
            </div>
        </form>
    );
}

function CouponOptions({ coupon, onToggle, onEdit, onDelete }) {
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
                        <button
                            type="button"
                            className="w-full text-left block px-3 py-2 text-dark hover:bg-gray-50"
                            onClick={() => { close(); onToggle(); }}
                        >
                            {coupon.status ? 'Deactivate' : 'Activate'}
                        </button>
                    </li>
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
