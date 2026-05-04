/**
 * CertificateSettings - Certificate template configuration.
 *
 * ============================================================================
 * ORIGINAL BLADE: admin certificate settings
 * ============================================================================
 *
 * Configure certificate template, background image, text positions.
 */

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useApi } from '@/hooks/useApi';
import { useSettings } from '@/contexts/SettingsContext';

const ENDPOINT = '/api/admin/settings/certificate';

export default function CertificateSettings() {
  const { translate, getImage } = useSettings();
  const { get, post } = useApi();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bgPreview, setBgPreview] = useState(null);
  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    (async () => {
      try {
        const res = await get(ENDPOINT);
        const data = res.data || res || {};
        reset(data);
        if (data.background_image) setBgPreview(getImage(data.background_image));
      } catch { /* defaults */ }
      finally { setLoading(false); }
    })();
  }, [get, reset, getImage]);

  const onSubmit = async (values) => {
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(values).forEach(([k, v]) => {
        if (k === 'background_image' && v?.[0]) fd.append('background_image', v[0]);
        else if (k !== 'background_image') fd.append(k, v ?? '');
      });
      await post(ENDPOINT, fd);
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
            {translate('Certificate Settings')}
          </h4>
        </div>
      </div>

      <div className="flex flex-wrap">
        <div className="w-full md:w-8/12">
          <div className="bg-white border border-gray-100 rounded-lg p-4">
            <div className="">
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="fpb-7 mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{translate('Certificate title')}</label>
                  <input className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" type="text" {...register('certificate_title')} />
                </div>

                <div className="fpb-7 mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{translate('Certificate body text')}</label>
                  <textarea className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" rows="4" {...register('certificate_body')} />
                </div>

                <div className="fpb-7 mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{translate('Background image')}</label>
                  {bgPreview && (
                    <div className="mb-2">
                      <img src={bgPreview} alt="" style={{ maxWidth: '100%', maxHeight: 200 }} />
                    </div>
                  )}
                  <input
                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    type="file"
                    accept="image/*"
                    {...register('background_image')}
                    onChange={(e) => {
                      register('background_image').onChange(e);
                      if (e.target.files[0]) setBgPreview(URL.createObjectURL(e.target.files[0]));
                    }}
                  />
                </div>

                <div className="flex items-center mb-3">
                  <input className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" type="checkbox" id="cert_enabled" {...register('certificate_enabled')} />
                  <label className="text-sm text-gray-700 ml-2" htmlFor="cert_enabled">{translate('Enable certificates')}</label>
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
