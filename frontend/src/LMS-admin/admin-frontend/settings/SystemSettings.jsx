/**
 * SystemSettings - Admin system settings page.
 *
 * ============================================================================
 * ORIGINAL BLADE: resources/views/admin/setting/system_setting.blade.php
 * ============================================================================
 *
 * Two-column layout:
 *   Left  – system settings form (site name, title, keywords, description,
 *           author, slogan, email, address, phone, API keys, language,
 *           tax, email verification, device limit, timezone, footer).
 *   Right – product update file upload.
 */

import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useApi } from '@/hooks/useApi';
import { useSettings } from '@/contexts/SettingsContext';
import { API } from '@/config/routes';

export default function SystemSettings() {
  const { translate } = useSettings();
  const { get, post } = useApi();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [languages, setLanguages] = useState([]);
  const [timezones, setTimezones] = useState([]);

  const { register, handleSubmit, reset } = useForm();
  const {
    register: registerUpdate,
    handleSubmit: handleUpdateSubmit,
  } = useForm();

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await get(API.ADMIN_SYSTEM_SETTINGS);
      if (res.data) reset(res.data);
      if (res.languages) setLanguages(res.languages);
      if (res.timezones) setTimezones(res.timezones);
    } catch {
      toast.error(translate('Failed to load settings'));
    } finally {
      setLoading(false);
    }
  }, [get, reset, translate]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      await post(API.ADMIN_SYSTEM_SETTINGS, data);
      toast.success(translate('Settings saved'));
    } catch {
      toast.error(translate('Failed to save settings'));
    } finally {
      setSaving(false);
    }
  };

  const onProductUpdate = async (data) => {
    if (!data.file?.[0]) return;
    const fd = new FormData();
    fd.append('file', data.file[0]);
    try {
      await post(`${API.ADMIN_SYSTEM_SETTINGS}/product-update`, fd);
      toast.success(translate('Product updated'));
    } catch {
      toast.error(translate('Failed to update product'));
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <div className="bg-white border border-gray-100 rounded-lg">
        <div className="px-5 my-3 py-4">
          <h4 className="title text-base">
            <i className="fi-rr-settings-sliders mr-2" />
            {translate('System Settings')}
          </h4>
        </div>
      </div>

      <div className="flex flex-wrap">
        {/* Left column — system settings form */}
        <div className="w-full md:w-7/12">
          <div className="bg-white border border-gray-100 rounded-lg p-4">
            <h3 className="title text-sm mb-3">{translate('System Settings')}</h3>
            <div className="">
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="fpb-7 mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="system_name">
                    {translate('Website name')}<span>*</span>
                  </label>
                  <input
                    id="system_name"
                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    type="text"
                    {...register('system_name', { required: true })}
                  />
                </div>

                <div className="fpb-7 mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="system_title">
                    {translate('Website title')}<span>*</span>
                  </label>
                  <input
                    id="system_title"
                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    type="text"
                    {...register('system_title', { required: true })}
                  />
                </div>

                <div className="fpb-7 mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="website_keywords">
                    {translate('Website keywords')}
                  </label>
                  <input
                    id="website_keywords"
                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full"
                    type="text"
                    {...register('website_keywords')}
                  />
                </div>

                <div className="fpb-7 mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="website_description">
                    {translate('Website description')}
                  </label>
                  <textarea
                    id="website_description"
                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    rows="5"
                    {...register('website_description')}
                  />
                </div>

                <div className="fpb-7 mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="author">
                    {translate('Author')}
                  </label>
                  <input
                    id="author"
                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    type="text"
                    {...register('author')}
                  />
                </div>

                <div className="fpb-7 mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="slogan">
                    {translate('Slogan')}<span>*</span>
                  </label>
                  <input
                    id="slogan"
                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    type="text"
                    {...register('slogan', { required: true })}
                  />
                </div>

                <div className="fpb-7 mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="system_email">
                    {translate('System email')}<span>*</span>
                  </label>
                  <input
                    id="system_email"
                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    type="text"
                    {...register('system_email', { required: true })}
                  />
                </div>

                <div className="fpb-7 mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="address">
                    {translate('Address')}
                  </label>
                  <textarea
                    id="address"
                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    rows="5"
                    {...register('address')}
                  />
                </div>

                <div className="fpb-7 mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="phone">
                    {translate('Phone')}
                  </label>
                  <input
                    id="phone"
                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    type="text"
                    {...register('phone')}
                  />
                </div>

                <div className="fpb-7 mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="youtube_api_key">
                    {translate('Youtube API key')}<span>*</span>
                  </label>
                  <input
                    id="youtube_api_key"
                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    type="text"
                    {...register('youtube_api_key', { required: true })}
                  />
                </div>

                <div className="fpb-7 mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="vimeo_api_key">
                    {translate('Vimeo API key')}<span>*</span>
                  </label>
                  <input
                    id="vimeo_api_key"
                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    type="text"
                    {...register('vimeo_api_key', { required: true })}
                  />
                </div>

                <div className="fpb-7 mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="purchase_code">
                    {translate('Purchase code')}<span>*</span>
                  </label>
                  <input
                    id="purchase_code"
                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    type="text"
                    {...register('purchase_code', { required: true })}
                  />
                </div>

                <div className="fpb-7 mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="language">
                    {translate('System language')}
                  </label>
                  <select
                    id="language"
                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    {...register('language')}
                  >
                    {languages.map((lang) => (
                      <option key={lang.id || lang.name} value={lang.name?.toLowerCase()}>
                        {lang.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="fpb-7 mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="course_selling_tax">
                    {translate('Course selling tax')} (%)
                    <span>*</span>
                  </label>
                  <div className="flex">
                    <input
                      id="course_selling_tax"
                      className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      type="number"
                      min="0"
                      max="100"
                      {...register('course_selling_tax', { required: true })}
                    />
                    <div className="input-group-append">
                      <span className="input-group-text w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">%</span>
                    </div>
                  </div>
                  <small>{translate('Enter 0 if you want to disable the tax option')}</small>
                </div>

                <div className="fpb-7 mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="student_email_verification">
                    {translate('Student email verification')}
                  </label>
                  <select
                    id="student_email_verification"
                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    {...register('student_email_verification')}
                  >
                    <option value="0">{translate('Disabled')}</option>
                    <option value="1">{translate('Enabled')}</option>
                  </select>
                </div>

                <div className="fpb-7 mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="device_limitation">
                    {translate('Device limitation')}
                  </label>
                  <input
                    id="device_limitation"
                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    type="number"
                    {...register('device_limitation', { required: true })}
                  />
                </div>

                <div className="fpb-7 mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="timezone">
                    {translate('Timezone')}
                  </label>
                  <select
                    id="timezone"
                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    {...register('timezone', { required: true })}
                  >
                    {timezones.map((tz) => (
                      <option key={tz} value={tz}>
                        {tz}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="fpb-7 mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="footer_text">
                    {translate('Footer text')}
                  </label>
                  <input
                    id="footer_text"
                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    type="text"
                    {...register('footer_text')}
                  />
                </div>

                <div className="fpb-7 mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="footer_link">
                    {translate('Footer link')}
                  </label>
                  <input
                    id="footer_link"
                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    type="text"
                    {...register('footer_link')}
                  />
                </div>

                <button className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-emerald-600 text-white hover:bg-emerald-700" type="submit" disabled={saving}>
                  {saving ? translate('Saving...') : translate('Save Changes')}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Right column — product update */}
        <div className="w-full md:w-5/12">
          <div className="bg-white border border-gray-100 rounded-lg p-4">
            <h3 className="title text-sm mb-3">{translate('Update Product')}</h3>
            <div className="">
              <form onSubmit={handleUpdateSubmit(onProductUpdate)}>
                <div className="fpb-7 mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{translate('File')}</label>
                  <input
                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    type="file"
                    {...registerUpdate('file', { required: true })}
                  />
                </div>
                <button className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-emerald-600 text-white hover:bg-emerald-700" type="submit">
                  {translate('Update')}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
