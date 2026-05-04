/**
 * SeoSettings - Per-route SEO meta tag management.
 *
 * ============================================================================
 * ORIGINAL BLADE: resources/views/admin/setting/seo_setting.blade.php
 * ============================================================================
 *
 * Vertical tab for each route. Each tab has: meta_title, meta_keywords,
 * meta_description, meta_robot, canonical_url, custom_url, og_title,
 * og_description, og_image, json_ld.
 */

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useApi } from '@/hooks/useApi';
import { useSettings } from '@/contexts/SettingsContext';

const ENDPOINT = '/api/admin/settings/seo';

export default function SeoSettings() {
  const { translate } = useSettings();
  const { get, post } = useApi();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [routes, setRoutes] = useState([]);
  const [activeRoute, setActiveRoute] = useState('');
  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    (async () => {
      try {
        const res = await get(ENDPOINT);
        const data = res.data || res || [];
        setRoutes(data);
        if (data.length > 0) {
          setActiveRoute(data[0].route);
          reset(data[0]);
        }
      } catch {
        toast.error(translate('Failed to load SEO settings'));
      } finally {
        setLoading(false);
      }
    })();
  }, [get, reset, translate]);

  const selectRoute = (route) => {
    setActiveRoute(route);
    const item = routes.find((r) => r.route === route);
    if (item) reset(item);
  };

  const onSubmit = async (values) => {
    setSaving(true);
    try {
      await post(`${ENDPOINT}/${encodeURIComponent(activeRoute)}`, values);
      toast.success(translate('SEO settings saved'));
    } catch {
      toast.error(translate('Failed to save'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  const fields = [
    { name: 'meta_title', label: 'Meta Title' },
    { name: 'meta_keywords', label: 'Meta Keywords' },
    { name: 'meta_description', label: 'Meta Description', textarea: true },
    { name: 'meta_robot', label: 'Meta Robot' },
    { name: 'canonical_url', label: 'Canonical URL' },
    { name: 'custom_url', label: 'Custom URL' },
    { name: 'og_title', label: 'OG Title' },
    { name: 'og_description', label: 'OG Description', textarea: true },
    { name: 'json_ld', label: 'JSON-LD', textarea: true },
  ];

  return (
    <>
      <div className="bg-white border border-gray-100 rounded-lg">
        <div className="px-5 my-3 py-4">
          <h4 className="title text-base">
            <i className="fi-rr-settings-sliders mr-2" />
            {translate('SEO Settings')}
          </h4>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-lg">
        <div className="p-5 mb-3">
          <h4 className="title text-base mb-20px">{translate('Manage SEO Settings')}</h4>
          <div className="flex  flex-wrap gap-3">
            {/* Route tabs */}
            <div className="w-full md:w-48 shrink-0">
              <div className="nav flex-column flex gap-2">
                {routes.map((r) => (
                  <button
                    key={r.route}
                    className={`px-3 py-2 text-sm text-gray-600 hover:text-emerald-600 ${activeRoute === r.route ? 'border-b-2 border-emerald-600 text-emerald-700 font-medium -mb-px' : ''}`}
                    type="button"
                    onClick={() => selectRoute(r.route)}
                  >
                    {r.route}
                  </button>
                ))}
              </div>
            </div>

            {/* Form */}
            <div className="w-full">
              <form onSubmit={handleSubmit(onSubmit)}>
                {fields.map((f) => (
                  <div className="fpb-7 mb-3" key={f.name}>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{translate(f.label)}</label>
                    {f.textarea ? (
                      <textarea className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" rows="3" {...register(f.name)} />
                    ) : (
                      <input className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" type="text" {...register(f.name)} />
                    )}
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
