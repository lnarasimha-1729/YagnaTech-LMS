/**
 * LogoImageSettings - Upload banner image, light logo, dark logo, favicon.
 *
 * ============================================================================
 * ORIGINAL BLADE: resources/views/admin/setting/logo_image.blade.php
 * ============================================================================
 */

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useApi } from '@/hooks/useApi';
import { useSettings } from '@/contexts/SettingsContext';

const IMAGE_TYPES = [
  { key: 'banner_image', label: 'Banner Image', size: '1000 x 700' },
  { key: 'light_logo', label: 'Light Logo', size: '330 x 70' },
  { key: 'dark_logo', label: 'Dark Logo', size: '330 x 70' },
  { key: 'favicon', label: 'Favicon', size: '90 x 90' },
];

export default function LogoImageSettings() {
  const { translate, getImage } = useSettings();
  const { get, post } = useApi();
  const [loading, setLoading] = useState(true);
  const [images, setImages] = useState({});
  const [files, setFiles] = useState({});
  const [saving, setSaving] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await get('/api/admin/settings/logo-images');
      const data = res.data || res;
      setImages(data);
    } catch {
      toast.error(translate('Failed to load'));
    } finally {
      setLoading(false);
    }
  }, [get, translate]);

  useEffect(() => { load(); }, [load]);

  const handleUpload = async (type) => {
    if (!files[type]) {
      toast.error(translate('Select a file first'));
      return;
    }
    setSaving((s) => ({ ...s, [type]: true }));
    try {
      const fd = new FormData();
      fd.append('type', type);
      fd.append(type, files[type]);
      await post('/api/admin/settings/logo-images', fd);
      toast.success(translate('Saved'));
      setFiles((f) => ({ ...f, [type]: null }));
      load();
    } catch {
      toast.error(translate('Failed to save'));
    } finally {
      setSaving((s) => ({ ...s, [type]: false }));
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="flex flex-wrap">
      {IMAGE_TYPES.map(({ key, label, size }) => (
        <div key={key} className="w-full xl:w-1/3 w-full lg:w-1/2 mb-4">
          <div className="bg-white border border-gray-100 rounded-lg p-4">
            <div className=" text-center">
              <div className="mb-3">
                {images[key] && (
                  <img
                    src={getImage(images[key])}
                    alt={label}
                    style={{ maxWidth: '100%', maxHeight: 150 }}
                    className={key === 'light_logo' ? 'bg-dark rounded px-2 py-2' : ''}
                  />
                )}
              </div>
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1.5 block">
                  {translate(label)} <small className="text-gray-500">({size})</small>
                </label>
                <input
                  className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFiles((f) => ({ ...f, [key]: e.target.files[0] || null }))}
                />
              </div>
              <button
                className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-emerald-600 text-white hover:bg-emerald-700 w-full"
                type="button"
                disabled={saving[key]}
                onClick={() => handleUpload(key)}
              >
                {saving[key] ? translate('Saving...') : translate('Save changes')}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
