/**
 * AdminProfile - Admin manage profile + change password.
 *
 * ============================================================================
 * ORIGINAL BLADE:
 *   resources/views/admin/profile/index.blade.php
 * ============================================================================
 *
 * Two-column layout:
 *   Left:  general profile (name, email, social links, about, skills,
 *          biography, photo upload) — multipart POST with type=general.
 *   Right: change password (current + new + confirm).
 *
 * Skills are a tags-input in the Blade; we use a simple comma/enter-separated
 * chip editor to keep parity without pulling in the tagify dependency.
 */

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';

export default function AdminProfile() {
  const { translate, getImage } = useSettings();
  const { user, refreshUser } = useAuth();
  const { get, post } = useApi();

  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: '',
    email: '',
    facebook: '',
    twitter: '',
    linkedin: '',
    about: '',
    skills: '',
    biography: '',
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [saving, setSaving] = useState(false);

  const [pwd, setPwd] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [savingPwd, setSavingPwd] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await get('/api/admin/profile');
        const data = res.data || res;
        const u = data.user || data;
        setForm({
          name: u.name || '',
          email: u.email || '',
          facebook: u.facebook || '',
          twitter: u.twitter || '',
          linkedin: u.linkedin || '',
          about: u.about || '',
          skills: u.skills || '',
          biography: u.biography || '',
        });
        setPhotoPreview(getImage(u.photo));
      } catch {
        // fall back to auth user context
        if (user) {
          setForm((f) => ({ ...f, name: user.name || '', email: user.email || '' }));
          setPhotoPreview(getImage(user.photo));
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [get, getImage, user]);

  const handleChange = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const submitProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('type', 'general');
      Object.entries(form).forEach(([k, v]) => fd.append(k, v ?? ''));
      if (photoFile) fd.append('photo', photoFile);
      await post('/api/admin/profile', fd);
      toast.success(translate('Profile updated'));
      if (refreshUser) refreshUser();
    } catch {
      toast.error(translate('Failed to update profile'));
    } finally {
      setSaving(false);
    }
  };

  const submitPassword = async (e) => {
    e.preventDefault();
    if (pwd.new_password !== pwd.confirm_password) {
      toast.error(translate('Passwords do not match'));
      return;
    }
    setSavingPwd(true);
    try {
      await post('/api/admin/profile/password', pwd);
      toast.success(translate('Password updated'));
      setPwd({ current_password: '', new_password: '', confirm_password: '' });
    } catch {
      toast.error(translate('Failed to update password'));
    } finally {
      setSavingPwd(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <div className="ol-card radius-8px">
        <div className="ol-card-body px-20px my-3 py-4">
          <h4 className="title text-base mb-0">
            <i className="fi-rr-settings-sliders mr-2" />
            {translate('Manage profile')}
          </h4>
        </div>
      </div>

      <div className="flex flex-wrap -mx-3">
        <div className="col-xl-7">
          <div className="ol-card p-4">
            <div className="ol-card-body">
              <form onSubmit={submitProfile}>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 block text-sm font-medium text-gray-700 mb-1.5">{translate('Name')}</label>
                  <input className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" type="text" required value={form.name} onChange={handleChange('name')} />
                </div>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 block text-sm font-medium text-gray-700 mb-1.5">{translate('Email')}</label>
                  <input className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" type="email" required value={form.email} onChange={handleChange('email')} />
                </div>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 block text-sm font-medium text-gray-700 mb-1.5">{translate('Facebook link')}</label>
                  <input className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" type="text" value={form.facebook} onChange={handleChange('facebook')} />
                </div>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 block text-sm font-medium text-gray-700 mb-1.5">{translate('Twitter link')}</label>
                  <input className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" type="text" value={form.twitter} onChange={handleChange('twitter')} />
                </div>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 block text-sm font-medium text-gray-700 mb-1.5">{translate('Linkedin link')}</label>
                  <input className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" type="text" value={form.linkedin} onChange={handleChange('linkedin')} />
                </div>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 block text-sm font-medium text-gray-700 mb-1.5">{translate('A short title about yourself')}</label>
                  <textarea className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" rows="3" value={form.about} onChange={handleChange('about')} />
                </div>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 block text-sm font-medium text-gray-700 mb-1.5">{translate('Skills')}</label>
                  <input
                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    type="text"
                    value={form.skills}
                    onChange={handleChange('skills')}
                    placeholder={translate('Comma-separated skills')}
                  />
                  <small className="text-gray-500">{translate('Separate multiple skills with commas')}</small>
                </div>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 block text-sm font-medium text-gray-700 mb-1.5">{translate('Biography')}</label>
                  <textarea className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" rows="5" value={form.biography} onChange={handleChange('biography')} />
                </div>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 block text-sm font-medium text-gray-700 mb-1.5">
                    {translate('Photo')} <small>({translate('Square image recommended')})</small>
                  </label>
                  <div className="flex flex-wrap -mx-3 items-center">
                    <div className="col-2">
                      {photoPreview && (
                        <img className="rounded-full img-thumbnail" src={photoPreview} alt="" style={{ width: 50, height: 50, objectFit: 'cover' }} />
                      )}
                    </div>
                    <div className="col-10">
                      <input className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" type="file" accept="image/*" onChange={handlePhotoChange} />
                    </div>
                  </div>
                </div>
                <button className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-indigo-600 text-white hover:bg-indigo-700 mt-3" type="submit" disabled={saving}>
                  {saving ? translate('Saving...') : translate('Update profile')}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-xl-5">
          <div className="ol-card p-4">
            <div className="ol-card-body">
              <form onSubmit={submitPassword}>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 block text-sm font-medium text-gray-700 mb-1.5">{translate('Current password')}</label>
                  <input
                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    type="password"
                    required
                    value={pwd.current_password}
                    onChange={(e) => setPwd({ ...pwd, current_password: e.target.value })}
                  />
                </div>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 block text-sm font-medium text-gray-700 mb-1.5">{translate('New password')}</label>
                  <input
                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    type="password"
                    required
                    value={pwd.new_password}
                    onChange={(e) => setPwd({ ...pwd, new_password: e.target.value })}
                  />
                </div>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 block text-sm font-medium text-gray-700 mb-1.5">{translate('Confirm password')}</label>
                  <input
                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    type="password"
                    required
                    value={pwd.confirm_password}
                    onChange={(e) => setPwd({ ...pwd, confirm_password: e.target.value })}
                  />
                </div>
                <button className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-indigo-600 text-white hover:bg-indigo-700" type="submit" disabled={savingPwd}>
                  {savingPwd ? translate('Saving...') : translate('Update password')}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
