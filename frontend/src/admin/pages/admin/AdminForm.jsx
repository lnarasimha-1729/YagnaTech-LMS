import { useEffect, useState } from 'react';
import axios from 'axios';
import { getToken } from '../../api/client';

const TABS = [
    { key: 'basic', label: 'Basic' },
    { key: 'login', label: 'Login Credentials' },
    { key: 'social', label: 'Social Links' },
];

// college-service direct (port 8005). Returns [{ clgId, clgName, ... }].
// We hit it from here so the College dropdown stays the same source of
// truth as the student profile dropdown — every admin assigned a college
// is guaranteed to use a real clgId that students can also pick.
const COLLEGE_SERVICE = import.meta.env.VITE_COLLEGE_SERVICE_URL || 'http://localhost:8005';

export default function AdminForm({ admin, onSubmit, submitLabel = 'Save' }) {
    const [tab, setTab] = useState(admin ? 'basic' : 'login');
    const [colleges, setColleges] = useState([]);
    const [collegesError, setCollegesError] = useState(null);
    const [f, setF] = useState({
        name: admin?.name || '',
        about: admin?.about || '',
        phone: admin?.phone || '',
        address: admin?.address || '',
        college_name: admin?.college_name || '',
        // Setting college_id flips this admin into "college admin" mode —
        // after login they only see the College Dashboard scoped to this id.
        // Leave blank for a root/general admin.
        college_id: admin?.college_id || '',
        email: admin?.email || '',
        password: '',
        facebook: admin?.facebook || '',
        twitter: admin?.twitter || '',
        linkedin: admin?.linkedin || '',
        website: admin?.website || '',
    });
    const [photo, setPhoto] = useState(null);
    const set = (k, v) => setF((s) => ({ ...s, [k]: v }));

    // Load colleges once for the dropdown. The admin token is accepted by
    // college-service because both services share JWT_ACCESS_SECRET.
    useEffect(() => {
        let alive = true;
        const token = getToken();
        if (!token) return;
        axios
            .get(`${COLLEGE_SERVICE}/all`, { headers: { Authorization: `Bearer ${token}` } })
            .then((res) => { if (alive) setColleges(Array.isArray(res.data) ? res.data : []); })
            .catch((err) => {
                if (!alive) return;
                const status = err?.response?.status;
                setCollegesError(
                    status
                        ? `Failed to load colleges (HTTP ${status}). College dropdown will be empty.`
                        : 'Could not reach college-service. College dropdown will be empty.'
                );
            });
        return () => { alive = false; };
    }, []);

    // Keep college_name in sync when admin picks from the college dropdown,
    // so the read-only "College name" field always reflects the choice and
    // root admin doesn't need to type it manually.
    const handleCollegePick = (clgId) => {
        const match = colleges.find((c) => c.clgId === clgId);
        setF((s) => ({
            ...s,
            college_id: clgId,
            college_name: match ? match.clgName : s.college_name,
        }));
    };

    const submit = (e) => {
        e.preventDefault();

        if (!admin) {
            if (!f.name || !f.email || !f.password) {
                alert('Name, email and password are required for new admins.');
                setTab('login');
                return;
            }
            if (String(f.password).length < 8) {
                alert('Password must be at least 8 characters.');
                setTab('login');
                return;
            }
        }

        const fd = new FormData();
        Object.entries(f).forEach(([k, v]) => {
            // college_id is intentionally allowed to be the empty string — it
            // tells the backend to clear the column (turn a college admin back
            // into a regular admin). All other empty fields are skipped.
            if (k === 'college_id') {
                fd.append(k, v ?? '');
                return;
            }
            if (v !== '' && v != null) fd.append(k, v);
        });
        if (photo) fd.append('photo', photo);
        onSubmit(fd);
    };

    return (
        <form onSubmit={submit} encType="multipart/form-data">
            <div className="flex flex-col md:flex-row gap-3">
                <div className="md:w-[220px]">
                    <div className="ol-sidebar-tab">
                        {TABS.map((t) => (
                            <button
                                key={t.key}
                                type="button"
                                className={`nav-link text-left ${tab === t.key ? 'active' : ''}`}
                                onClick={() => setTab(t.key)}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex-grow">
                    {tab === 'basic' && (
                        <>
                            <div className="mb-3 grid grid-cols-12 gap-0">
                                <label className="col-span-2 ol-form-label">Name<span className="text-danger ms-1">*</span></label>
                                <div className="col-span-10">
                                    <input className="ol-form-control" value={f.name} onChange={(e) => set('name', e.target.value)} required />
                                </div>
                            </div>
                            <div className="mb-3 grid grid-cols-12 gap-0">
                                <label className="col-span-2 ol-form-label">Biography</label>
                                <div className="col-span-10">
                                    <textarea className="ol-form-control" rows="3" value={f.about} onChange={(e) => set('about', e.target.value)} />
                                </div>
                            </div>
                            <div className="mb-3 grid grid-cols-12 gap-0">
                                <label className="col-span-2 ol-form-label">Phone</label>
                                <div className="col-span-10">
                                    <input className="ol-form-control" value={f.phone} onChange={(e) => set('phone', e.target.value)} />
                                </div>
                            </div>
                            <div className="mb-3 grid grid-cols-12 gap-0">
                                <label className="col-span-2 ol-form-label">Address</label>
                                <div className="col-span-10">
                                    <input className="ol-form-control" value={f.address} onChange={(e) => set('address', e.target.value)} />
                                </div>
                            </div>
                            <div className="mb-3 grid grid-cols-12 gap-0">
                                <label className="col-span-2 ol-form-label">College</label>
                                <div className="col-span-10">
                                    <select
                                        className="ol-form-control"
                                        value={f.college_id}
                                        onChange={(e) => handleCollegePick(e.target.value)}
                                    >
                                        <option value="">— Root / General admin (no college) —</option>
                                        {colleges.map((c) => (
                                            <option key={c.clgId} value={c.clgId}>
                                                {c.clgName} ({c.clgId})
                                            </option>
                                        ))}
                                        {/* If editing an admin whose college_id is no longer in the
                                            list (deleted college), keep it visible so root admin
                                            can see what's set and fix it. */}
                                        {f.college_id &&
                                            !colleges.some((c) => c.clgId === f.college_id) && (
                                                <option value={f.college_id}>
                                                    {f.college_id} (not in list — please reselect)
                                                </option>
                                            )}
                                    </select>
                                    <p className="text-[12px] text-gray mt-1">
                                        Pick a college to make this a college admin — they'll log in
                                        and see only the College Dashboard scoped to that college's
                                        students. Leave blank for a regular admin with full access.
                                    </p>
                                    {collegesError && (
                                        <p className="text-[12px] text-amber-700 mt-1">{collegesError}</p>
                                    )}
                                    {!collegesError && colleges.length === 0 && (
                                        <p className="text-[12px] text-amber-700 mt-1">
                                            No colleges exist yet. Add one in the College section first.
                                        </p>
                                    )}
                                </div>
                            </div>
                            {/* College Name shows the human label that was picked above. We
                                keep it editable in case root admin wants to override the display
                                name without changing the bound clgId (rare). */}
                            <div className="mb-3 grid grid-cols-12 gap-0">
                                <label className="col-span-2 ol-form-label">College name</label>
                                <div className="col-span-10">
                                    <input
                                        className="ol-form-control"
                                        value={f.college_name}
                                        onChange={(e) => set('college_name', e.target.value)}
                                        placeholder="Auto-fills when you pick a college above"
                                    />
                                </div>
                            </div>
                            <div className="mb-3 grid grid-cols-12 gap-0">
                                <label className="col-span-2 ol-form-label">User image</label>
                                <div className="col-span-10">
                                    {admin?.photo && <div className="mb-2"><img src={`${import.meta.env.VITE_ADMIN_API_URL || 'http://localhost:4000'}/${admin.photo}`} alt="" className="w-[80px] h-[80px] rounded-full object-cover border border-ebordermuted" /></div>}
                                    <input className="ol-form-control" type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files[0])} />
                                </div>
                            </div>
                        </>
                    )}
                    {tab === 'login' && (
                        <>
                            <div className="mb-3 grid grid-cols-12 gap-0">
                                <label className="col-span-2 ol-form-label">Email<span className="text-danger ms-1">*</span></label>
                                <div className="col-span-10">
                                    <input type="email" className="ol-form-control" value={f.email} onChange={(e) => set('email', e.target.value)} required />
                                </div>
                            </div>
                            <div className="mb-3 grid grid-cols-12 gap-0">
                                <label className="col-span-2 ol-form-label">Password{!admin && <span className="text-danger ms-1">*</span>}</label>
                                <div className="col-span-10">
                                    <input
                                        type="password"
                                        className="ol-form-control"
                                        value={f.password}
                                        onChange={(e) => set('password', e.target.value)}
                                        placeholder={admin ? 'Leave blank to keep current' : 'Minimum 8 characters'}
                                        required={!admin}
                                        minLength={admin ? undefined : 8}
                                    />
                                </div>
                            </div>
                        </>
                    )}
                    {tab === 'social' && (
                        <>
                            <div className="mb-3 grid grid-cols-12 gap-0">
                                <label className="col-span-2 ol-form-label">Facebook</label>
                                <div className="col-span-10">
                                    <input className="ol-form-control" value={f.facebook} onChange={(e) => set('facebook', e.target.value)} />
                                </div>
                            </div>
                            <div className="mb-3 grid grid-cols-12 gap-0">
                                <label className="col-span-2 ol-form-label">Twitter</label>
                                <div className="col-span-10">
                                    <input className="ol-form-control" value={f.twitter} onChange={(e) => set('twitter', e.target.value)} />
                                </div>
                            </div>
                            <div className="mb-3 grid grid-cols-12 gap-0">
                                <label className="col-span-2 ol-form-label">Linkedin</label>
                                <div className="col-span-10">
                                    <input className="ol-form-control" value={f.linkedin} onChange={(e) => set('linkedin', e.target.value)} />
                                </div>
                            </div>
                        </>
                    )}
                    <div className="mt-4">
                        <button className="ol-btn-primary">{submitLabel}</button>
                    </div>
                </div>
            </div>
        </form>
    );
}
