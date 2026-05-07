/**
 * OpenAiSettings — port of admin/open_ai/settings.blade.php.
 * Simple form for OpenAI model, max tokens, and secret key.
 */

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useApi } from '@/hooks/useApi';
import { useSettings } from '@/contexts/SettingsContext';

const ENDPOINT = '/api/admin/settings/open-ai';

const inputClass =
  'w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent';
const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5';

export default function OpenAiSettings() {
  const { translate } = useSettings();
  const { get, post } = useApi();
  const [loading, setLoading] = useState(true);
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm({
    defaultValues: {
      open_ai_model: 'gpt-3.5-turbo-0125',
      open_ai_max_token: 1024,
      open_ai_secret_key: '',
    },
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await get(ENDPOINT);
        const data = res.data || res || {};
        reset({
          open_ai_model: data.open_ai_model || 'gpt-3.5-turbo-0125',
          open_ai_max_token: data.open_ai_max_token ?? 1024,
          open_ai_secret_key: data.open_ai_secret_key || '',
        });
      } catch {
        // keep defaults
      } finally {
        setLoading(false);
      }
    })();
  }, [get, reset]);

  const onSubmit = async (values) => {
    try {
      await post(ENDPOINT, values);
      toast.success(translate('Settings saved'));
    } catch {
      toast.error(translate('Failed to save'));
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <div className="bg-white border border-gray-100 rounded-lg mb-4">
        <div className="px-5 py-3">
          <h4 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <i className="fi-rr-settings-sliders" />
            {translate('Open AI Settings')}
          </h4>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-100 rounded-lg p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            {translate('Manage your open ai settings')}
          </h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className={labelClass} htmlFor="open_ai_model">
                {translate('Select AI model')}
              </label>
              <select
                id="open_ai_model"
                className={inputClass}
                {...register('open_ai_model')}
              >
                <option value="gpt-3.5-turbo-0125">gpt-3.5-turbo-0125</option>
                <option value="gpt-4-0125-preview">
                  gpt-4-0125-preview ({translate('Required premium account')})
                </option>
              </select>
            </div>

            <div>
              <label className={labelClass} htmlFor="open_ai_max_token">
                {translate('Max tokens')} <span className="text-rose-500">*</span>
              </label>
              <input
                id="open_ai_max_token"
                type="number"
                min={20}
                max={2048}
                className={inputClass}
                {...register('open_ai_max_token', { required: true, min: 20, max: 2048 })}
              />
            </div>

            <div>
              <label className={labelClass} htmlFor="open_ai_secret_key">
                {translate('Secret key')} <span className="text-rose-500">*</span>
              </label>
              <input
                id="open_ai_secret_key"
                type="text"
                className={inputClass}
                {...register('open_ai_secret_key', { required: true })}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {isSubmitting ? translate('Saving...') : translate('Save changes')}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
