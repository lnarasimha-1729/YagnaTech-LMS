/**
 * FrontendSettings - Frontend website configuration.
 *
 * ============================================================================
 * ORIGINAL BLADE: resources/views/admin/setting/frontend_setting.blade.php
 * ============================================================================
 *
 * Fields: banner_title, banner_sub_title, promo_video_provider, promo_video_link,
 * cookie_status, cookie_note, social links (facebook, twitter, linkedin),
 * cookie_policy, about_us, terms_and_condition, privacy_policy, refund_policy,
 * mobile_app_link.
 */

import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useApi } from '@/hooks/useApi';
import { useSettings } from '@/contexts/SettingsContext';

const ENDPOINT = '/api/admin/settings/frontend';

export default function FrontendSettings() {
  const { translate } = useSettings();
  const { get, post } = useApi();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset, control } = useForm();

  const cookieStatus = useWatch({ control, name: 'cookie_status', defaultValue: '0' });

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
            {translate('Frontend Website Settings')}
          </h4>
        </div>
      </div>

      <div className="flex flex-wrap">
        <div className="w-full md:w-8/12">
          <div className="bg-white border border-gray-100 rounded-lg p-4">
            <div className="">
              <form onSubmit={handleSubmit(onSubmit)}>
                {/* Banner */}
                <h5 className="mb-3">{translate('Banner')}</h5>
                <div className="fpb-7 mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{translate('Banner title')} <span className="text-red-600">*</span></label>
                  <input className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" type="text" {...register('banner_title')} />
                </div>
                <div className="fpb-7 mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{translate('Banner sub title')} <span className="text-red-600">*</span></label>
                  <input className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" type="text" {...register('banner_sub_title')} />
                </div>

                {/* Promo Video */}
                <div className="fpb-7 mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{translate('Promo Video Provider')} <span className="text-red-600">*</span></label>
                  <div className="flex gap-3">
                    {['youtube', 'vimeo', 'html5'].map((p) => (
                      <div key={p}>
                        <input className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" type="radio" id={`promo_${p}`} value={p} {...register('promo_video_provider')} />
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1" htmlFor={`promo_${p}`}>
                          {p === 'youtube' ? 'Youtube' : p === 'vimeo' ? 'Vimeo' : 'HTML5'}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="fpb-7 mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{translate('Promo video link')} <span className="text-red-600">*</span></label>
                  <input className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" type="text" {...register('promo_video_link')} />
                </div>

                <hr className="my-4" />

                {/* Cookie */}
                <h5 className="mb-3">{translate('Cookie Settings')}</h5>
                <div className="fpb-7 mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{translate('Cookie status')} <span className="text-red-600">*</span></label>
                  <div className="flex gap-4">
                    <div>
                      <input className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" type="radio" id="cookie_active" value="1" {...register('cookie_status')} />
                      <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1" htmlFor="cookie_active">{translate('Active')}</label>
                    </div>
                    <div>
                      <input className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" type="radio" id="cookie_inactive" value="0" {...register('cookie_status')} />
                      <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1" htmlFor="cookie_inactive">{translate('Inactive')}</label>
                    </div>
                  </div>
                </div>
                {String(cookieStatus) === '1' && (
                  <div className="fpb-7 mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{translate('Cookie note')}</label>
                    <textarea className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" rows="4" {...register('cookie_note')} />
                  </div>
                )}

                <hr className="my-4" />

                {/* Social Links */}
                <h5 className="mb-3">{translate('Social Links')}</h5>
                {[
                  { name: 'facebook', label: 'Facebook' },
                  { name: 'twitter', label: 'Twitter' },
                  { name: 'linkedin', label: 'Linkedin' },
                ].map((s) => (
                  <div className="fpb-7 mb-3" key={s.name}>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{translate(s.label)}</label>
                    <input className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" type="text" {...register(s.name)} />
                  </div>
                ))}

                <hr className="my-4" />

                {/* Policies */}
                <h5 className="mb-3">{translate('Policies & Pages')}</h5>
                {[
                  { name: 'cookie_policy', label: 'Cookie policy' },
                  { name: 'about_us', label: 'About us' },
                  { name: 'terms_and_condition', label: 'Terms and condition' },
                  { name: 'privacy_policy', label: 'Privacy policy' },
                  { name: 'refund_policy', label: 'Refund policy' },
                ].map((f) => (
                  <div className="fpb-7 mb-3" key={f.name}>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{translate(f.label)}</label>
                    <textarea className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" rows="5" {...register(f.name)} />
                  </div>
                ))}

                {/* Mobile App */}
                <div className="fpb-7 mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{translate('Mobile App download Link')}</label>
                  <input className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" type="text" {...register('mobile_app_link')} />
                </div>

                <button className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-emerald-600 text-white hover:bg-emerald-700" type="submit" disabled={saving}>
                  {saving ? translate('Saving...') : translate('Update Settings')}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
