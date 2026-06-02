import { useState } from 'react';
import { API_BASE } from '../../api/client';

// Mirrors AdminForm's structure: tabbed sidebar (Basic / Login Credentials /
// Social Links), grid-cols-12 rows, same controls and submit button — only
// the field set differs (instructor-specific: expertise / experience).
const TABS = [
    { key: 'basic', label: 'Basic' },
    { key: 'login', label: 'Login Credentials' },
    { key: 'social', label: 'Social Links' },
];

export default function InstructorForm({ instructor, onSubmit, submitLabel = 'Save' }) {
    const [tab, setTab] = useState(instructor ? 'basic' : 'login');
    const [f, setF] = useState({
        name: instructor?.name || '',
        bio: instructor?.bio || '',
        phone: instructor?.phone || '',
        address: instructor?.address || '',
        expertise: instructor?.expertise || '',
        yearsOfExperience: instructor?.yearsOfExperience ?? '',
        email: instructor?.email || '',
        password: '',
        linkedinUrl: instructor?.linkedinUrl || '',
        facebookUrl: instructor?.facebookUrl || '',
        twitterUrl: instructor?.twitterUrl || '',
    });
    const [photo, setPhoto] = useState(null);
    const set = (k, v) => setF((s) => ({ ...s, [k]: v }));

    const submit = (e) => {
        e.preventDefault();

        if (!instructor) {
            if (!f.name || !f.email || !f.password) {
                alert('Name, email and password are required for new instructors.');
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
                                    <textarea className="ol-form-control" rows="3" value={f.bio} onChange={(e) => set('bio', e.target.value)} />
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
                                <label className="col-span-2 ol-form-label">Expertise</label>
                                <div className="col-span-10">
                                    <input
                                        className="ol-form-control"
                                        value={f.expertise}
                                        onChange={(e) => set('expertise', e.target.value)}
                                        placeholder="e.g. AI, ML, Python"
                                    />
                                </div>
                            </div>
                            <div className="mb-3 grid grid-cols-12 gap-0">
                                <label className="col-span-2 ol-form-label">Experience (years)</label>
                                <div className="col-span-10">
                                    <input
                                        type="number"
                                        min="0"
                                        className="ol-form-control"
                                        value={f.yearsOfExperience}
                                        onChange={(e) => set('yearsOfExperience', e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="mb-3 grid grid-cols-12 gap-0">
                                <label className="col-span-2 ol-form-label">User image</label>
                                <div className="col-span-10">
                                    {/* Existing image preview (edit flow). Backend returns
                                        a relative path under /uploads — prepend API_BASE the
                                        same way the rest of the admin app does. */}
                                    {instructor?.photo && !photo && (
                                        <div className="mb-2">
                                            <img
                                                src={`${API_BASE}/${instructor.photo}`}
                                                alt=""
                                                className="w-[80px] h-[80px] rounded-full object-cover border border-ebordermuted"
                                            />
                                        </div>
                                    )}
                                    <input className="ol-form-control" type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files[0])} />
                                    {instructor?.photo && (
                                        <p className="text-[12px] text-gray mt-1">
                                            Leave empty to keep the current image.
                                        </p>
                                    )}
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
                                <label className="col-span-2 ol-form-label">Password{!instructor && <span className="text-danger ms-1">*</span>}</label>
                                <div className="col-span-10">
                                    <input
                                        type="password"
                                        className="ol-form-control"
                                        value={f.password}
                                        onChange={(e) => set('password', e.target.value)}
                                        placeholder={instructor ? 'Leave blank to keep current' : 'Minimum 8 characters'}
                                        required={!instructor}
                                        minLength={instructor ? undefined : 8}
                                    />
                                </div>
                            </div>
                        </>
                    )}
                    {tab === 'social' && (
                        <>
                            <div className="mb-3 grid grid-cols-12 gap-0">
                                <label className="col-span-2 ol-form-label">Linkedin</label>
                                <div className="col-span-10">
                                    <input
                                        className="ol-form-control"
                                        value={f.linkedinUrl}
                                        onChange={(e) => set('linkedinUrl', e.target.value)}
                                        placeholder="https://linkedin.com/in/..."
                                    />
                                </div>
                            </div>
                            <div className="mb-3 grid grid-cols-12 gap-0">
                                <label className="col-span-2 ol-form-label">Facebook</label>
                                <div className="col-span-10">
                                    <input
                                        className="ol-form-control"
                                        value={f.facebookUrl}
                                        onChange={(e) => set('facebookUrl', e.target.value)}
                                        placeholder="https://facebook.com/..."
                                    />
                                </div>
                            </div>
                            <div className="mb-3 grid grid-cols-12 gap-0">
                                <label className="col-span-2 ol-form-label">Twitter</label>
                                <div className="col-span-10">
                                    <input
                                        className="ol-form-control"
                                        value={f.twitterUrl}
                                        onChange={(e) => set('twitterUrl', e.target.value)}
                                        placeholder="https://twitter.com/..."
                                    />
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
