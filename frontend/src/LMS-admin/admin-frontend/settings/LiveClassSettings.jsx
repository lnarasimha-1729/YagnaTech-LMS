/**
 * LiveClassSettings - Zoom live class configuration.
 *
 * ============================================================================
 * ORIGINAL BLADE: resources/views/admin/setting/live_class_settings.blade.php
 * ============================================================================
 *
 * Fields: zoom_account_email, zoom_account_id, zoom_client_id,
 * zoom_client_secret, zoom_sdk_key, zoom_sdk_secret.
 */

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useApi } from '@/hooks/useApi';
import { useSettings } from '@/contexts/SettingsContext';

const ENDPOINT = '/api/admin/settings/live-class';

export default function LiveClassSettings() {
  const { translate } = useSettings();
  const { get, post } = useApi();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    (async () => {
      try {
        const res = await get(ENDPOINT);
        reset(res.data || res || {});
      } catch { /* use defaults */ }
      finally { setLoading(false); }
    })();
  }, [get, reset]);

  const onSubmit = async (values) => {
    setSaving(true);
    try {
      await post(ENDPOINT, values);
      toast.success(translate('Settings saved'));
    } catch {
      toast.error(translate('Failed to save'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  const fields = [
    { name: 'zoom_account_email', label: 'Account Email', type: 'email' },
    { name: 'zoom_account_id', label: 'Account ID' },
    { name: 'zoom_client_id', label: 'Client ID' },
    { name: 'zoom_client_secret', label: 'Client Secret' },
    { name: 'zoom_sdk_key', label: 'SDK Key' },
    { name: 'zoom_sdk_secret', label: 'SDK Secret' },
  ];

  return (
    <>
      <div className="bg-white border border-gray-100 rounded-lg">
        <div className="px-5 my-3 py-4">
          <h4 className="title text-base">
            <i className="fi-rr-settings-sliders mr-2" />
            {translate('Live Class Settings')}
          </h4>
        </div>
      </div>

      <div className="flex flex-wrap">
        <div className="w-full md:w-7/12">
          <div className="bg-white border border-gray-100 rounded-lg p-4">
            <h3 className="title text-sm mb-3">
              {translate('Configure ZOOM server-to-server-oauth credentials')}
            </h3>
            <div className="">
              <form onSubmit={handleSubmit(onSubmit)}>
                {fields.map((f) => (
                  <div className="fpb-7 mb-3" key={f.name}>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{translate(f.label)}</label>
                    <input
                      className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      type={f.type || 'text'}
                      {...register(f.name)}
                    />
                  </div>
                ))}
                <button className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-emerald-600 text-white hover:bg-emerald-700" type="submit" disabled={saving}>
                  {saving ? translate('Saving...') : translate('Save changes')}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
