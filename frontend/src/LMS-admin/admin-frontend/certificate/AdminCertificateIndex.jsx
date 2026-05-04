/**
 * AdminCertificateIndex — table-style certificate management page.
 *
 * Mirror of frontend/src/admin/pages/certificate/Index.jsx, kept under the
 * legacy admin-frontend tree so both directories expose the same module.
 * Talks to /api/admin/certificate (CRUD + status toggle) via useApi.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import { BsThreeDotsVertical } from 'react-icons/bs';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useApi } from '@/hooks/useApi';
import { useSettings } from '@/contexts/SettingsContext';

export default function AdminCertificateIndex() {
    const { translate, getImage } = useSettings();
    const { get, post, del } = useApi();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [activeQuery, setActiveQuery] = useState({});
    const [addOpen, setAddOpen] = useState(false);
    const [editCert, setEditCert] = useState(null);
    const [confirm, setConfirm] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await get('/api/admin/certificate', { params: activeQuery });
            setData(res.data || res);
        } catch (err) {
            setError(err?.response?.data?.error || translate('Failed to load certificates'));
        } finally {
            setLoading(false);
        }
    }, [get, activeQuery, translate]);

    useEffect(() => { load(); }, [load]);

    const onSearch = (e) => {
        e.preventDefault();
        const next = { ...activeQuery };
        const term = search.trim();
        if (term) next.search = term; else delete next.search;
        setActiveQuery(next);
    };

    const handleDelete = async (id) => {
        try {
            await del(`/api/admin/certificate/delete/${id}`);
            toast.success(translate('Certificate deleted successfully'));
            setConfirm(null);
            load();
        } catch (e) {
            toast.error(e.response?.data?.error || translate('Failed'));
            setConfirm(null);
        }
    };

    const handleToggle = async (id) => {
        try {
            await get(`/api/admin/certificate/status/${id}`);
            toast.success(translate('Status has been updated'));
            load();
        } catch (e) {
            toast.error(e.response?.data?.error || translate('Failed'));
        }
    };

    const openEdit = async (id) => {
        try {
            const res = await get(`/api/admin/certificate/edit/${id}`);
            const payload = res.data || res;
            setEditCert(payload.certificate);
        } catch (e) {
            toast.error(e.response?.data?.error || translate('Failed to load certificate'));
        }
    };

    const handlePrint = () => window.print();

    if (loading && !data) return <LoadingSpinner />;

    if (error && !data) {
        return (
            <div className="ol-card rounded-ol-8">
                <div className="ol-card-body py-10 px-6 text-center">
                    <p className="text-[16px] font-semibold text-danger mb-2">{translate('Couldn’t load certificates')}</p>
                    <p className="text-[13px] text-gray mb-4">{error}</p>
                    <button className="ol-btn-primary" onClick={load}>{translate('Retry')}</button>
                </div>
            </div>
        );
    }

    const rows = data?.certificates?.data || [];
    const isEmpty = rows.length === 0;
    const total = data?.certificates?.total || 0;
    const currentPage = data?.certificates?.current_page || 1;
    const lastPage = data?.certificates?.last_page || 1;
    const perPage = data?.certificates?.per_page || 10;

    return (
        <>
            <div className="ol-card rounded-ol-8 mb-3">
                <div className="ol-card-body py-12px px-20px my-3">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <h4 className="text-[16px] font-semibold text-dark m-0 flex items-center gap-2">
                            <i className="fi-rr-settings-sliders" />
                            {translate('Certificate')}
                        </h4>
                        <button
                            type="button"
                            className="ol-btn-outline-secondary flex items-center gap-10px"
                            onClick={() => setAddOpen(true)}
                        >
                            <span className="fi-rr-plus" />
                            <span>{translate('Add Certificate')}</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="ol-card">
                <div className="ol-card-body p-3">
                    <div className="grid grid-cols-12 gap-3 mb-3 mt-3 items-center">
                        <div className="col-span-12 md:col-span-6">
                            <ExportDropdown onPdf={handlePrint} onPrint={handlePrint} translate={translate} />
                        </div>
                        <div className="col-span-12 md:col-span-6">
                            <form onSubmit={onSearch} className="flex justify-end gap-3">
                                <input
                                    className="ol-form-control flex-grow"
                                    name="search"
                                    type="text"
                                    placeholder={translate('Search certificate')}
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                                <button type="submit" className="ol-btn-primary">{translate('Search')}</button>
                            </form>
                        </div>
                    </div>

                    {isEmpty ? (
                        <div className="py-12 text-center border border-dashed border-border rounded-ol-8">
                            <p className="text-[16px] font-semibold text-dark mb-1">{translate('No certificates found')}</p>
                            <p className="text-[13px] text-gray">{translate('Try adjusting your search or add a new certificate.')}</p>
                        </div>
                    ) : (
                        <>
                            <div className="flex justify-between items-center flex-wrap gap-3 mb-3">
                                <p className="text-gray text-[14px] m-0">
                                    {translate('Showing')} {rows.length} {translate('of')} {total} {translate('data')}
                                </p>
                                {loading && <span className="text-[12px] text-gray">{translate('Refreshing…')}</span>}
                            </div>
                            <div className="overflow-x-auto">
                                <table className="e-table">
                                    <thead>
                                        <tr>
                                            <th scope="col">#</th>
                                            <th scope="col">{translate('Title')}</th>
                                            <th scope="col">{translate('Identifier')}</th>
                                            <th scope="col">{translate('Template')}</th>
                                            <th scope="col">{translate('Status')}</th>
                                            <th scope="col">{translate('Options')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows.map((c, i) => (
                                            <tr key={c.id}>
                                                <td>{(currentPage - 1) * perPage + i + 1}</td>
                                                <td className="min-w-[180px]">
                                                    <h4 className="text-[14px] font-semibold text-dark m-0">{c.title}</h4>
                                                    {c.description && (
                                                        <p className="text-[12px] text-gray m-0 mt-1 line-clamp-1">{c.description}</p>
                                                    )}
                                                </td>
                                                <td>
                                                    <code className="text-[12px] text-gray">{c.identifier || '-'}</code>
                                                </td>
                                                <td>
                                                    {c.template_image ? (
                                                        <img
                                                            src={getImage(c.template_image)}
                                                            alt={c.title}
                                                            className="w-[60px] h-[40px] object-cover rounded"
                                                        />
                                                    ) : (
                                                        <span className="text-[12px] text-gray">—</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <span className={`inline-block px-2 py-1 rounded-ol-8 text-[11px] font-semibold ${
                                                        c.status ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                    }`}>
                                                        {c.status ? translate('Active') : translate('Inactive')}
                                                    </span>
                                                </td>
                                                <td>
                                                    <CertificateOptions
                                                        certificate={c}
                                                        translate={translate}
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
                                total={lastPage}
                                current={currentPage}
                                onPage={(p) => setActiveQuery({ ...activeQuery, page: p })}
                            />
                        </>
                    )}
                </div>
            </div>

            {addOpen && (
                <Modal title={translate('Add Certificate')} onClose={() => setAddOpen(false)}>
                    <CertificateForm
                        translate={translate}
                        getImage={getImage}
                        submitLabel={translate('Add certificate')}
                        onSubmit={async (fd) => {
                            try {
                                await post('/api/admin/certificate/store', fd);
                                toast.success(translate('Certificate has been created successfully.'));
                                setAddOpen(false);
                                load();
                            } catch (e) {
                                toast.error(e.response?.data?.error || translate('Failed'));
                            }
                        }}
                    />
                </Modal>
            )}

            {editCert && (
                <Modal title={translate('Edit Certificate')} onClose={() => setEditCert(null)}>
                    <CertificateForm
                        translate={translate}
                        getImage={getImage}
                        initial={editCert}
                        submitLabel={translate('Update certificate')}
                        onSubmit={async (fd) => {
                            try {
                                await post(`/api/admin/certificate/update/${editCert.id}`, fd);
                                toast.success(translate('Certificate has been updated successfully.'));
                                setEditCert(null);
                                load();
                            } catch (e) {
                                toast.error(e.response?.data?.error || translate('Failed'));
                            }
                        }}
                    />
                </Modal>
            )}

            {confirm && (
                <ConfirmDialog
                    message={translate('Delete this certificate?')}
                    translate={translate}
                    onCancel={() => setConfirm(null)}
                    onConfirm={() => handleDelete(confirm)}
                />
            )}
        </>
    );
}

function CertificateForm({ initial, onSubmit, submitLabel, translate, getImage }) {
    const [form, setForm] = useState({
        title: initial?.title || '',
        description: initial?.description || '',
        status: initial?.status === undefined ? '1' : String(initial.status),
    });
    const [file, setFile] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const set = (k, v) => setForm((s) => ({ ...s, [k]: v }));

    const submit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const fd = new FormData();
            fd.append('title', form.title);
            fd.append('description', form.description ?? '');
            fd.append('status', form.status);
            if (file) fd.append('template_image', file);
            await onSubmit(fd);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={submit}>
            <div className="mb-3">
                <label className="ol-form-label" htmlFor="title">{translate('Title')}</label>
                <input
                    id="title"
                    className="ol-form-control"
                    name="title"
                    type="text"
                    placeholder={translate('Enter certificate title')}
                    required
                    value={form.title}
                    onChange={(e) => set('title', e.target.value)}
                />
            </div>

            <div className="mb-3">
                <label className="ol-form-label" htmlFor="description">{translate('Description')}</label>
                <textarea
                    id="description"
                    className="ol-form-control"
                    name="description"
                    placeholder={translate('Optional description')}
                    rows={3}
                    value={form.description}
                    onChange={(e) => set('description', e.target.value)}
                />
            </div>

            <div className="mb-3">
                <label className="ol-form-label" htmlFor="template_image">{translate('Template image')}</label>
                {initial?.template_image && !file && (
                    <div className="mb-2">
                        <img
                            src={getImage(initial.template_image)}
                            alt={initial.title}
                            className="max-h-[140px] rounded border border-border"
                        />
                    </div>
                )}
                <input
                    id="template_image"
                    className="ol-form-control"
                    name="template_image"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
            </div>

            <div className="mb-3">
                <label className="ol-form-label" htmlFor="status">{translate('Status')}</label>
                <select
                    id="status"
                    className="ol-form-control"
                    name="status"
                    required
                    value={form.status}
                    onChange={(e) => set('status', e.target.value)}
                >
                    <option value="1">{translate('Active')}</option>
                    <option value="0">{translate('Inactive')}</option>
                </select>
            </div>

            <div className="flex justify-end">
                <button type="submit" className="ol-btn-primary" disabled={submitting}>
                    {submitting ? translate('Saving…') : submitLabel}
                </button>
            </div>
        </form>
    );
}

function CertificateOptions({ certificate, translate, onToggle, onEdit, onDelete }) {
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
                            {certificate.status ? translate('Deactivate') : translate('Activate')}
                        </button>
                    </li>
                    <li>
                        <button
                            type="button"
                            className="w-full text-left block px-3 py-2 text-dark hover:bg-gray-50"
                            onClick={() => { close(); onEdit(); }}
                        >
                            {translate('Edit')}
                        </button>
                    </li>
                    <li>
                        <button
                            type="button"
                            className="w-full text-left block px-3 py-2 text-danger hover:bg-gray-50"
                            onClick={() => { close(); onDelete(); }}
                        >
                            {translate('Delete')}
                        </button>
                    </li>
                </ul>,
                document.body,
            )}
        </div>
    );
}

function ExportDropdown({ onPdf, onPrint, translate }) {
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
                {translate('Export')}
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
                            <i className="fi-rr-print" /> {translate('Print')}
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

function Modal({ title, children, onClose }) {
    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onClose]);
    return createPortal(
        <div className="fixed inset-0 z-[1000] bg-black/40 flex items-start justify-center pt-[10vh] px-4" onMouseDown={onClose}>
            <div
                className="bg-white rounded-ol-8 shadow-lg w-full max-w-[560px] max-h-[80vh] overflow-y-auto"
                onMouseDown={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <h5 className="text-[15px] font-semibold text-dark m-0">{title}</h5>
                    <button type="button" onClick={onClose} className="text-gray hover:text-dark">×</button>
                </div>
                <div className="p-4">{children}</div>
            </div>
        </div>,
        document.body,
    );
}

function ConfirmDialog({ message, onCancel, onConfirm, translate }) {
    return createPortal(
        <div className="fixed inset-0 z-[1000] bg-black/40 flex items-center justify-center px-4" onMouseDown={onCancel}>
            <div
                className="bg-white rounded-ol-8 shadow-lg w-full max-w-[400px]"
                onMouseDown={(e) => e.stopPropagation()}
            >
                <div className="p-5">
                    <p className="text-[14px] text-dark m-0">{message}</p>
                </div>
                <div className="flex justify-end gap-2 px-4 py-3 border-t border-border">
                    <button type="button" className="ol-btn-light" onClick={onCancel}>{translate('Cancel')}</button>
                    <button type="button" className="ol-btn-primary" onClick={onConfirm}>{translate('Delete')}</button>
                </div>
            </div>
        </div>,
        document.body,
    );
}
