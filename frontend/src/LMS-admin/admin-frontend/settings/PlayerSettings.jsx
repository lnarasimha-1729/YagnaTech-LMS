/**
 * PlayerSettings - Course player configuration.
 *
 * ============================================================================
 * ORIGINAL BLADE: resources/views/admin/setting/player_settings.blade.php
 * ============================================================================
 *
 * Fields: watermark toggle, watermark text, autoplay, default playback speed,
 * player theme color.
 */

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useApi } from '@/hooks/useApi';
import { useSettings } from '@/contexts/SettingsContext';

const ENDPOINT = '/api/admin/settings/player';

export default function PlayerSettings() {
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
      } catch { /* defaults */ }
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

  return (
    <>
      <div className="bg-white border border-gray-100 rounded-lg">
        <div className="px-5 my-3 py-4">
          <h4 className="title text-base">
            <i className="fi-rr-settings-sliders mr-2" />
            {translate('Player Settings')}
          </h4>
        </div>
      </div>

      <div className="flex flex-wrap">
        <div className="w-full md:w-7/12">
          <div className="bg-white border border-gray-100 rounded-lg p-4">
            <div className="">
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="flex items-center mb-3">
                  <input className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" type="checkbox" id="watermark_enabled" {...register('watermark_enabled')} />
                  <label className="text-sm text-gray-700 ml-2" htmlFor="watermark_enabled">{translate('Enable watermark')}</label>
                </div>

                <div className="fpb-7 mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{translate('Watermark text')}</label>
                  <input className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" type="text" {...register('watermark_text')} />
                </div>

                <div className="flex items-center mb-3">
                  <input className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" type="checkbox" id="autoplay" {...register('autoplay')} />
                  <label className="text-sm text-gray-700 ml-2" htmlFor="autoplay">{translate('Autoplay next lesson')}</label>
                </div>

                <div className="fpb-7 mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{translate('Default playback speed')}</label>
                  <select className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" {...register('default_speed')}>
                    <option value="0.5">0.5x</option>
                    <option value="0.75">0.75x</option>
                    <option value="1">1x</option>
                    <option value="1.25">1.25x</option>
                    <option value="1.5">1.5x</option>
                    <option value="2">2x</option>
                  </select>
                </div>

                <div className="fpb-7 mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{translate('Player theme color')}</label>
                  <input className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" type="color" {...register('theme_color')} />
                </div>

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
