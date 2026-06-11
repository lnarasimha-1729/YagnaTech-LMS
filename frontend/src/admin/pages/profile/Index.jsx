import { useState } from 'react';
import { getStoredUser, changePassword, updateProfile, patchStoredUser } from '../../api/auth';

// Manage Profile — left card edits the profile (name, email, social links,
// short title, skills, biography, photo); right card changes the password.
// Both are wired to admin-service (/auth/update-profile, /auth/change-password),
// which handle admins (lms_admin.users) and instructors (lucy_devdb.users).
// Note: for instructors, fields without a column (twitter/facebook/skills/
// biography) are accepted but ignored server-side.
export default function ManageProfile() {
    const user = getStoredUser() || {};

    // Profile form — prefilled from the cached user where available.
    const [form, setForm] = useState({
        name: user.name || '',
        email: user.email || '',
        facebook: user.facebook || '',
        twitter: user.twitter || '',
        linkedin: user.linkedin || user.linkedinUrl || '',
        // "Area of Expertise" maps to the expertise column — the same field the
        // admin's Add/Edit Instructor form writes. Accept either schema shape
        // when prefilling (instructor auth schema: expertise; admin schema:
        // about as a legacy fallback). "biography" maps to the bio column.
        expertise: user.expertise || user.about || '',
        biography: user.biography || user.bio || '',
    });
    const setField = (k, v) => setForm((s) => ({ ...s, [k]: v }));

    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);

    const [savingProfile, setSavingProfile] = useState(false);
    const [profileError, setProfileError] = useState('');
    const [profileSuccess, setProfileSuccess] = useState('');

    const submitProfile = async (e) => {
        e.preventDefault();
        setProfileError('');
        setProfileSuccess('');
        if (!form.name.trim()) return setProfileError('Name is required.');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
            return setProfileError('Please enter a valid email.');
        }

        setSavingProfile(true);
        try {
            const res = await updateProfile(form, photoFile);
            // Keep the cached user in sync with the edit so a page reload
            // re-prefills the form without needing a fresh login. Mirror both
            // schema shapes (instructor: expertise/bio/linkedinUrl; admin:
            // biography/linkedin) so whichever the prefill reads is set.
            // Also persist the new photo path (returned by updateProfile) under
            // all the keys the navbar/avatar might read, so the avatar updates.
            const newPhoto = res?.photo ?? undefined;
            patchStoredUser({
                name: form.name.trim(),
                email: form.email.trim(),
                facebook: form.facebook,
                twitter: form.twitter,
                linkedin: form.linkedin,
                linkedinUrl: form.linkedin,
                expertise: form.expertise,
                biography: form.biography,
                bio: form.biography,
                ...(newPhoto ? { photo: newPhoto, instructorPhoto: newPhoto, studentPhoto: newPhoto } : {}),
            });
            setProfileSuccess('Profile updated successfully.');
            setPhotoFile(null);
            // The top navbar reads the user from useAuth (/me), which won't
            // reflect the new photo until it re-fetches. A soft reload is the
            // most reliable way to refresh every consumer of the avatar.
            if (newPhoto) setTimeout(() => window.location.reload(), 600);
        } catch (err) {
            setProfileError(err?.response?.data?.error || 'Failed to update profile.');
        } finally {
            setSavingProfile(false);
        }
    };

    // Password change — wired to POST /api/admin/auth/change-password.
    const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
    const [pwSaving, setPwSaving] = useState(false);
    const [pwError, setPwError] = useState('');
    const [pwSuccess, setPwSuccess] = useState('');

    const setPwField = (k, v) => setPw((s) => ({ ...s, [k]: v }));

    const submitPassword = async (e) => {
        e.preventDefault();
        setPwError('');
        setPwSuccess('');
        if (!pw.current || !pw.next) return setPwError('Please fill in all password fields.');
        if (pw.next.length < 6) return setPwError('New password must be at least 6 characters.');
        if (pw.next !== pw.confirm) return setPwError('New password and confirmation do not match.');

        setPwSaving(true);
        try {
            await changePassword({
                currentPassword: pw.current,
                newPassword: pw.next,
                confirmPassword: pw.confirm,
            });
            setPwSuccess('Password updated successfully.');
            setPw({ current: '', next: '', confirm: '' });
        } catch (err) {
            setPwError(err?.response?.data?.error || 'Failed to update password.');
        } finally {
            setPwSaving(false);
        }
    };

    const onPhoto = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setPhotoFile(file);
            setPhotoPreview(URL.createObjectURL(file));
        }
    };

    return (
        <div>
            <div className="ol-card rounded-ol-8 mb-3">
                <div className="ol-card-body py-12px px-20px my-3">
                    <h4 className="text-[16px] font-semibold text-dark m-0 flex items-center gap-2">
                        <i className="fi-rr-settings-sliders" />
                        Manage Profile
                    </h4>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-start">
                {/* Left: profile details */}
                <div className="ol-card">
                    <div className="ol-card-body p-20px">
                        <form onSubmit={submitProfile} className="space-y-4">
                            {profileError && (
                                <div className="px-3 py-2 rounded-ol-8 bg-red-50 border border-red-200 text-red-700 text-[13px]">
                                    {profileError}
                                </div>
                            )}
                            {profileSuccess && (
                                <div className="px-3 py-2 rounded-ol-8 bg-green-50 border border-green-200 text-green-700 text-[13px]">
                                    {profileSuccess}
                                </div>
                            )}
                            <div>
                                <label className="block text-[14px] text-dark mb-1">Name</label>
                                <input
                                    type="text"
                                    className="ol-form-control w-full"
                                    placeholder="Your name"
                                    value={form.name}
                                    onChange={(e) => setField('name', e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-[14px] text-dark mb-1">Email</label>
                                <input
                                    type="email"
                                    className="ol-form-control w-full"
                                    placeholder="you@example.com"
                                    value={form.email}
                                    onChange={(e) => setField('email', e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-[14px] text-dark mb-1">Facebook link</label>
                                <input
                                    type="url"
                                    className="ol-form-control w-full"
                                    placeholder="https://facebook.com/…"
                                    value={form.facebook}
                                    onChange={(e) => setField('facebook', e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-[14px] text-dark mb-1">Twitter link</label>
                                <input
                                    type="url"
                                    className="ol-form-control w-full"
                                    placeholder="https://twitter.com/…"
                                    value={form.twitter}
                                    onChange={(e) => setField('twitter', e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-[14px] text-dark mb-1">Linkedin link</label>
                                <input
                                    type="url"
                                    className="ol-form-control w-full"
                                    placeholder="https://linkedin.com/in/…"
                                    value={form.linkedin}
                                    onChange={(e) => setField('linkedin', e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-[14px] text-dark mb-1">Area of Expertise</label>
                                <input
                                    type="text"
                                    className="ol-form-control w-full"
                                    placeholder="e.g. AI, ML, Python"
                                    value={form.expertise}
                                    onChange={(e) => setField('expertise', e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-[14px] text-dark mb-1">Biography</label>
                                <textarea
                                    className="ol-form-control w-full"
                                    rows={8}
                                    placeholder="Tell learners about yourself…"
                                    value={form.biography}
                                    onChange={(e) => setField('biography', e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-[14px] text-dark mb-1">
                                    Photo <span className="text-[12px] text-gray">(The image size should be any square image)</span>
                                </label>
                                <div className="flex items-center gap-3">
                                    <span className="w-[60px] h-[60px] rounded-full bg-gray-100 overflow-hidden flex items-center justify-center shrink-0">
                                        {photoPreview
                                            ? <img src={photoPreview} alt="" className="w-full h-full object-cover" />
                                            : <i className="fi-rr-picture text-gray" />}
                                    </span>
                                    <input type="file" accept="image/*" onChange={onPhoto} className="ol-form-control flex-1" />
                                </div>
                            </div>

                            <button type="submit" className="ol-btn-primary" disabled={savingProfile}>
                                {savingProfile ? 'Updating…' : 'Update profile'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Right: change password (functional) */}
                <div className="ol-card">
                    <div className="ol-card-body p-20px">
                        <form onSubmit={submitPassword} className="space-y-4">
                            {pwError && (
                                <div className="px-3 py-2 rounded-ol-8 bg-red-50 border border-red-200 text-red-700 text-[13px]">
                                    {pwError}
                                </div>
                            )}
                            {pwSuccess && (
                                <div className="px-3 py-2 rounded-ol-8 bg-green-50 border border-green-200 text-green-700 text-[13px]">
                                    {pwSuccess}
                                </div>
                            )}
                            <div>
                                <label className="block text-[14px] text-dark mb-1">Current password</label>
                                <input
                                    type="password"
                                    className="ol-form-control w-full"
                                    autoComplete="current-password"
                                    value={pw.current}
                                    onChange={(e) => setPwField('current', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-[14px] text-dark mb-1">New password</label>
                                <input
                                    type="password"
                                    className="ol-form-control w-full"
                                    autoComplete="new-password"
                                    value={pw.next}
                                    onChange={(e) => setPwField('next', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-[14px] text-dark mb-1">Confirm password</label>
                                <input
                                    type="password"
                                    className="ol-form-control w-full"
                                    autoComplete="new-password"
                                    value={pw.confirm}
                                    onChange={(e) => setPwField('confirm', e.target.value)}
                                />
                            </div>
                            <button type="submit" className="ol-btn-primary" disabled={pwSaving}>
                                {pwSaving ? 'Updating…' : 'Update password'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
