/**
 * AdminInstructorSettings — port of admin/instructor/instructor_setting.blade.php.
 * Two side-by-side forms: public instructor gating + revenue split.
 */

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useApi } from '@/hooks/useApi';
import { useSettings } from '@/contexts/SettingsContext';

export default function AdminInstructorSettings() {
  const { translate } = useSettings();
  const { get, post } = useApi();

  const [loading, setLoading] = useState(true);
  const [savingPublic, setSavingPublic] = useState(false);
  const [savingRevenue, setSavingRevenue] = useState(false);

  const [allowInstructor, setAllowInstructor] = useState('1');
  const [note, setNote] = useState('');
  const [instructorRevenue, setInstructorRevenue] = useState(70);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await get('/api/admin/instructor-settings');
      const data = res.data || res || {};
      setAllowInstructor(String(data.allow_instructor ?? '1'));
      setNote(data.instructor_application_note || '');
      const rev = Number(data.instructor_revenue ?? 70);
      setInstructorRevenue(Number.isFinite(rev) ? rev : 70);
    } catch {
      toast.error(translate('Failed to load settings'));
    } finally {
      setLoading(false);
    }
  }, [get, translate]);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const adminRevenue = Math.max(0, Math.min(100, 100 - Number(instructorRevenue || 0)));

  const savePublic = async (e) => {
    e.preventDefault();
    setSavingPublic(true);
    try {
      await post('/api/admin/instructor-settings', {
        section: 'public',
        allow_instructor: allowInstructor,
        instructor_application_note: note,
      });
      toast.success(translate('Settings updated'));
    } catch {
      toast.error(translate('Failed to save'));
    } finally {
      setSavingPublic(false);
    }
  };

  const saveRevenue = async (e) => {
    e.preventDefault();
    const rev = Number(instructorRevenue);
    if (!Number.isFinite(rev) || rev < 0 || rev > 100) {
      toast.error(translate('Instructor revenue must be between 0 and 100'));
      return;
    }
    setSavingRevenue(true);
    try {
      await post('/api/admin/instructor-settings', {
        section: 'revenue',
        instructor_revenue: rev,
      });
      toast.success(translate('Settings updated'));
    } catch {
      toast.error(translate('Failed to save'));
    } finally {
      setSavingRevenue(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <div className="bg-white border border-gray-100 rounded-lg mb-4">
        <div className="flex items-center justify-between px-5 py-3 flex-wrap gap-3">
          <h4 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <i className="fi-rr-settings-sliders" />
            {translate('Public Instructor Settings')}
          </h4>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-100 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">{translate('Instructor settings')}</h3>
          <form onSubmit={savePublic} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {translate('Allow public instructor')}
              </label>
              <select
                className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={allowInstructor}
                onChange={(e) => setAllowInstructor(e.target.value)}
                required
              >
                <option value="1">{translate('Yes')}</option>
                <option value="0">{translate('No')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {translate('Instructor application note')}
              </label>
              <textarea
                className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                rows="8"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center px-5 py-2.5 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
              disabled={savingPublic}
            >
              {savingPublic ? translate('Saving...') : translate('Update settings')}
            </button>
          </form>
        </div>

        <div className="bg-white border border-gray-100 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">{translate('Revenue settings')}</h3>
          <form onSubmit={saveRevenue} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {translate('Instructor revenue percentage')}
              </label>
              <div className="flex">
                <input
                  className="flex-1 bg-white border border-gray-200 rounded-l-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  type="number"
                  min="0"
                  max="100"
                  value={instructorRevenue}
                  onChange={(e) => setInstructorRevenue(e.target.value)}
                />
                <span className="px-4 py-2.5 text-sm bg-gray-50 border border-l-0 border-gray-200 rounded-r-lg text-gray-700">%</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {translate('Admin revenue percentage')}
              </label>
              <div className="flex">
                <input
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-l-lg px-4 py-2.5 text-sm"
                  type="number"
                  value={adminRevenue}
                  disabled
                />
                <span className="px-4 py-2.5 text-sm bg-gray-50 border border-l-0 border-gray-200 rounded-r-lg text-gray-700">%</span>
              </div>
            </div>
            <button
              type="submit"
              className="inline-flex items-center px-5 py-2.5 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
              disabled={savingRevenue}
            >
              {savingRevenue ? translate('Saving...') : translate('Update settings')}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
