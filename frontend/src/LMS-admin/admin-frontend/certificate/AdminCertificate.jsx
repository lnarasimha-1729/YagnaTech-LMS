/**
 * AdminCertificate - Certificate template preview + upload.
 *
 * ============================================================================
 * ORIGINAL BLADE:
 *   resources/views/admin/certificate/index.blade.php
 *   resources/views/admin/certificate/builder.blade.php  (drag-and-drop canvas)
 * ============================================================================
 *
 * Two-column layout:
 *   Left:  certificate preview (server-rendered HTML stored in settings)
 *          + "Build your certificate" button linking to the builder.
 *   Right: upload new certificate template image.
 *
 * The builder page is a complex drag-and-drop canvas that remains a server
 * rendered page until a React-based canvas editor is implemented.
 */

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useApi } from '@/hooks/useApi';
import { useSettings } from '@/contexts/SettingsContext';

export default function AdminCertificate() {
  const { translate, getImage } = useSettings();
  const { get, post } = useApi();

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState('');
  const [templateImage, setTemplateImage] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const res = await get('/api/admin/certificate');
      const data = res.data || res;
      setPreview(data.certificate_builder_content || '');
      setTemplateImage(data.certificate_template || '');
    } catch {
      toast.error(translate('Failed to load certificate'));
    } finally {
      setLoading(false);
    }
  }, [get, translate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleUpload = async (e) => {
    e.preventDefault();
    const fileInput = e.target.elements.certificate_template;
    if (!fileInput.files[0]) {
      toast.error(translate('Select a file'));
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('certificate_template', fileInput.files[0]);
      await post('/api/admin/certificate/upload-template', fd);
      toast.success(translate('Template uploaded'));
      fetchData();
    } catch {
      toast.error(translate('Failed to upload'));
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <div className="ol-card radius-8px">
        <div className="ol-card-body px-20px my-3 py-4">
          <div className="flex items-center justify-between flex-md-nowrap flex-wrap gap-3">
            <h4 className="title text-base">
              <i className="fi-rr-settings-sliders mr-2" />
              {translate('Certificate')}
            </h4>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap -mx-3">
        <div className="w-full md:w-1/2">
          <div className="ol-card p-4">
            <p className="title text-sm mb-3">{translate('Certificate template')}</p>
            <div className="ol-card-body">
              {preview ? (
                <div
                  className="certificate_builder_view"
                  style={{ overflow: 'auto', maxHeight: 500 }}
                  dangerouslySetInnerHTML={{ __html: preview }}
                />
              ) : (
                <p className="text-gray-500">{translate('No certificate template configured')}</p>
              )}
              <a className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-indigo-600 text-white hover:bg-indigo-700 mt-3" href="/admin/certificate/builder">
                {translate('Build your certificate')}
              </a>
            </div>
          </div>
        </div>

        <div className="w-full md:w-1/2">
          <div className="ol-card p-4">
            <p className="title text-sm mb-3">{translate('Certificate template')}</p>
            <div className="ol-card-body">
              <form onSubmit={handleUpload}>
                {templateImage && (
                  <div className="mb-4 mb-3 text-left">
                    <img
                      className="my-2"
                      src={getImage(templateImage)}
                      alt="certificate"
                      style={{ height: 200, maxWidth: '100%' }}
                    />
                  </div>
                )}
                <div className="mb-4 mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 block text-sm font-medium text-gray-700 mb-1.5" htmlFor="certificate_template">
                    {translate('Upload your certificate template')}
                  </label>
                  <input
                    id="certificate_template"
                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    name="certificate_template"
                    type="file"
                    accept="image/*"
                  />
                </div>
                <button className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-indigo-600 text-white hover:bg-indigo-700" type="submit" disabled={uploading}>
                  {uploading ? translate('Uploading...') : translate('Upload')}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
