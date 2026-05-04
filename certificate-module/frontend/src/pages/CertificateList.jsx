import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listCertificates, deleteCertificate, issueCertificate } from '../api/certificate';

export default function CertificateList() {
    const [data, setData] = useState(null);
    const [issuing, setIssuing] = useState(false);
    const [form, setForm] = useState({ user_id: '', course_id: '' });
    const [message, setMessage] = useState(null);

    const load = () => listCertificates().then(setData).catch(() => setData({ certificates: [] }));
    useEffect(() => { load(); }, []);

    const onIssue = async (e) => {
        e.preventDefault();
        if (!form.user_id || !form.course_id) return;
        setIssuing(true);
        setMessage(null);
        try {
            const res = await issueCertificate(form.user_id, form.course_id, 100);
            setMessage({
                kind: 'success',
                text: res.created
                    ? `Issued certificate ${res.certificate.identifier}`
                    : `Already issued (${res.certificate.identifier})`,
            });
            setForm({ user_id: '', course_id: '' });
            await load();
        } catch (err) {
            setMessage({ kind: 'error', text: err?.response?.data?.error || 'Failed' });
        } finally {
            setIssuing(false);
        }
    };

    const onDelete = async (id) => {
        if (!confirm('Delete this certificate?')) return;
        try {
            await deleteCertificate(id);
            await load();
        } catch (err) {
            setMessage({ kind: 'error', text: err?.response?.data?.error || 'Failed' });
        }
    };

    if (!data) return <div className="text-muted">Loading…</div>;

    const rows = data.certificates;

    return (
        <div>
            <div className="ol-card mb-4">
                <div className="ol-card-body py-3 px-5 flex items-center justify-between flex-wrap gap-3">
                    <h4 className="text-[16px] font-semibold text-dark m-0 flex items-center gap-2">
                        <i className="fa fa-certificate" />
                        Issued Certificates
                    </h4>
                </div>
            </div>

            {message && (
                <div className={`mb-4 ${message.kind === 'success' ? 'alert-success' : 'alert-primary'}`}>{message.text}</div>
            )}

            <section className="ol-card p-4 mb-4">
                <h5 className="text-[14px] font-semibold text-dark mb-3">Issue manually (for testing)</h5>
                <form onSubmit={onIssue} className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                        <label className="ol-form-label">User ID</label>
                        <input className="ol-form-control" type="number" value={form.user_id}
                            onChange={(e) => setForm((f) => ({ ...f, user_id: e.target.value }))} placeholder="99" />
                    </div>
                    <div>
                        <label className="ol-form-label">Course ID</label>
                        <input className="ol-form-control" type="number" value={form.course_id}
                            onChange={(e) => setForm((f) => ({ ...f, course_id: e.target.value }))} placeholder="101" />
                    </div>
                    <div className="flex items-end">
                        <button type="submit" className="ol-btn-primary w-full" disabled={issuing}>
                            {issuing ? 'Issuing…' : 'Issue'}
                        </button>
                    </div>
                </form>
                <p className="text-[12px] text-muted mt-2">
                    In production this is called by the player when course progress reaches 100%.
                </p>
            </section>

            <section className="ol-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-[14px]">
                        <thead className="bg-bodybg text-dark">
                            <tr>
                                <th className="text-left px-4 py-3">#</th>
                                <th className="text-left px-4 py-3">Identifier</th>
                                <th className="text-left px-4 py-3">Student</th>
                                <th className="text-left px-4 py-3">Course</th>
                                <th className="text-left px-4 py-3">Issued</th>
                                <th className="text-right px-4 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center px-4 py-8 text-muted">
                                        No certificates issued yet.
                                    </td>
                                </tr>
                            ) : rows.map((c) => (
                                <tr key={c.id} className="border-t border-border">
                                    <td className="px-4 py-3">{c.id}</td>
                                    <td className="px-4 py-3">
                                        <code className="text-skin">{c.identifier}</code>
                                    </td>
                                    <td className="px-4 py-3">{c.user?.name || `User #${c.user_id}`}</td>
                                    <td className="px-4 py-3">{c.course?.title || `Course #${c.course_id}`}</td>
                                    <td className="px-4 py-3 text-muted text-[12px]">
                                        {c.created_at ? new Date(c.created_at).toLocaleString() : '—'}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <Link to={`/certificate/${c.identifier}`} className="ol-btn-outline mr-2" target="_blank" rel="noreferrer">
                                            View
                                        </Link>
                                        <button type="button" className="ol-btn-danger" onClick={() => onDelete(c.id)}>Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
