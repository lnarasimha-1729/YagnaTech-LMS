/**
 * ContactInformationSettings - Website contact info (email/phone/address/hours/location).
 *
 * ============================================================================
 * ORIGINAL BLADE: resources/views/admin/setting/contact_information.blade.php
 * ============================================================================
 */

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useApi } from '@/hooks/useApi';
import { useSettings } from '@/contexts/SettingsContext';

export default function ContactInformationSettings() {
  const { translate } = useSettings();
  const { get, post } = useApi();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    email: '',
    phone: '',
    address: '',
    office_hours: '',
    location: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await get('/api/admin/settings/contact-info');
      const data = res.data || res;
      setForm((f) => ({ ...f, ...data }));
    } catch {
      toast.error(translate('Failed to load contact information'));
    } finally {
      setLoading(false);
    }
  }, [get, translate]);

  useEffect(() => { load(); }, [load]);

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await post('/api/admin/settings/contact-info', { ...form, _method: 'PUT' });
      toast.success(translate('Saved'));
    } catch {
      toast.error(translate('Failed to save'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <h4 className="title mb-3 mt-4">{translate('Contact Information')}</h4>
      <form onSubmit={submit}>
        <div className="flex flex-wrap">
          <div className="w-full md:w-7/12">
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{translate('Contact Email')}</label>
              <textarea
                className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                rows="2"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
              />
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{translate('Phone Number')}</label>
              <textarea
                className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                rows="2"
                value={form.phone}
                onChange={(e) => update('phone', e.target.value)}
              />
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{translate('Address')}</label>
              <textarea
                className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                rows="2"
                value={form.address}
                onChange={(e) => update('address', e.target.value)}
              />
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{translate('Office Hours')}</label>
              <textarea
                className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                rows="2"
                value={form.office_hours}
                onChange={(e) => update('office_hours', e.target.value)}
              />
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {translate('Location')}{' '}
                <small className="text-xs text-gray-500">
                  ({translate('Latitude')}, {translate('Longitude')})
                </small>
              </label>
              <input
                className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                type="text"
                placeholder="40.689880, -74.045203"
                value={form.location}
                onChange={(e) => update('location', e.target.value)}
              />
            </div>
            <button className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-emerald-600 text-white hover:bg-emerald-700" type="submit" disabled={saving}>
              {saving ? translate('Saving...') : translate('Submit')}
            </button>
          </div>
        </div>
      </form>
    </>
  );
}
