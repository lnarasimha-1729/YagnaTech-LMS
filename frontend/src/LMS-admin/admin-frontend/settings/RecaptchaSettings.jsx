/**
 * RecaptchaSettings - Google reCAPTCHA v3 configuration.
 *
 * ============================================================================
 * ORIGINAL BLADE: resources/views/admin/setting/recaptcha.blade.php
 * ============================================================================
 *
 * Fields: recaptcha_status (active/inactive), recaptcha_sitekey, recaptcha_secretkey.
 */

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useApi } from '@/hooks/useApi';
import { useSettings } from '@/contexts/SettingsContext';

const ENDPOINT = '/api/admin/settings/recaptcha';

export default function RecaptchaSettings() {
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
            {translate('Recaptcha Settings')}
          </h4>
        </div>
      </div>

      <div className="flex flex-wrap">
        <div className="w-full md:w-7/12">
          <div className="bg-white border border-gray-100 rounded-lg p-4">
            <div className="">
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="fpb-7 mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {translate('Recaptcha status')} <span className="text-red-600">*</span>
                  </label>
                  <div className="flex gap-4">
                    <div>
                      <input className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" type="radio" id="recaptcha_active" value="1" {...register('recaptcha_status')} />
                      <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1" htmlFor="recaptcha_active">{translate('Active')}</label>
                    </div>
                    <div>
                      <input className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" type="radio" id="recaptcha_inactive" value="0" {...register('recaptcha_status')} />
                      <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1" htmlFor="recaptcha_inactive">{translate('Inactive')}</label>
                    </div>
                  </div>
                </div>

                <div className="fpb-7 mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="recaptcha_sitekey">
                    {translate('Recaptcha sitekey')} (v3) <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="recaptcha_sitekey"
                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    type="text"
                    {...register('recaptcha_sitekey')}
                  />
                </div>

                <div className="fpb-7 mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="recaptcha_secretkey">
                    {translate('Recaptcha secretkey')} (v3) <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="recaptcha_secretkey"
                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    type="text"
                    {...register('recaptcha_secretkey')}
                  />
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
