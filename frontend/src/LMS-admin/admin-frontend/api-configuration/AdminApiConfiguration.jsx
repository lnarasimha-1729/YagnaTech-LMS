/**
 * AdminApiConfiguration - API key settings for YouTube, Google Drive, Vimeo.
 *
 * ============================================================================
 * ORIGINAL BLADE: resources/views/admin/api_configuration/index.blade.php
 * ============================================================================
 */

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useApi } from '@/hooks/useApi';
import { useSettings } from '@/contexts/SettingsContext';

export default function AdminApiConfiguration() {
  const { translate } = useSettings();
  const { get, post } = useApi();

  const [loading, setLoading] = useState(true);
  const [values, setValues] = useState({ youtube_api_key: '', vimeo_api_key: '' });
  const [saving, setSaving] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await get('/api/admin/settings/api-keys');
      const data = res.data || res;
      setValues({
        youtube_api_key: data.youtube_api_key || '',
        vimeo_api_key: data.vimeo_api_key || '',
      });
    } catch {
      toast.error(translate('Failed to load settings'));
    } finally {
      setLoading(false);
    }
  }, [get, translate]);

  useEffect(() => { load(); }, [load]);

  const update = async (type) => {
    setSaving((s) => ({ ...s, [type]: true }));
    try {
      await post(`/api/admin/settings/api-keys/${type}`, { [type]: values[type] });
      toast.success(translate('Updated'));
    } catch {
      toast.error(translate('Failed to save'));
    } finally {
      setSaving((s) => ({ ...s, [type]: false }));
    }
  };

  const field = (type, label) => (
    <div className="w-full md:w-1/3">
      <label className="block text-sm font-medium text-gray-700 mb-1.5 block text-sm font-medium text-gray-700 mb-1.5">{translate(label)}</label>
      <div className="flex mb-3">
        <input
          className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          type="text"
          value={values[type]}
          onChange={(e) => setValues({ ...values, [type]: e.target.value })}
        />
        <button
          type="button"
          className="input-group-text inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-green-500 text-white hover:bg-green-600"
          disabled={saving[type]}
          onClick={() => update(type)}
        >
          {saving[type] ? translate('Saving...') : translate('Update')}
        </button>
      </div>
    </div>
  );

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <div className="mainSection-title">
        <h4>{translate('API Configurations')}</h4>
      </div>

      <div className="eSection-wrap-2">
        <div className="flex flex-wrap -mx-3 g-2">
          {field('youtube_api_key', 'Youtube & Google Drive API key')}
          {field('vimeo_api_key', 'Vimeo API key')}
        </div>
      </div>
    </>
  );
}
