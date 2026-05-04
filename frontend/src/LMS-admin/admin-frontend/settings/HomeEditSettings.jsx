/**
 * HomeEditSettings - Edit theme-specific homepage settings (images, text, sliders).
 *
 * ============================================================================
 * ORIGINAL BLADE: resources/views/admin/setting/home_edit/home_edit.blade.php
 * ============================================================================
 *
 * Each homepage theme (cooking, university, development, kindergarden,
 * marketplace, meditation) has unique customizable fields. This component
 * loads the active theme's settings and renders the appropriate form.
 */

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useApi } from '@/hooks/useApi';
import { useSettings } from '@/contexts/SettingsContext';

export default function HomeEditSettings() {
  const { id } = useParams();
  const { translate, getImage } = useSettings();
  const { get, post } = useApi();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [formData, setFormData] = useState({});
  const [files, setFiles] = useState({});
  const [sliderItems, setSliderItems] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await get(`/api/admin/settings/home-edit/${id}`);
      const data = res.data || res;
      setIdentifier(data.identifier || '');
      setFormData(data.settings || {});
      setSliderItems(data.slider_items || data.sliders || []);
    } catch {
      toast.error(translate('Failed to load settings'));
    } finally {
      setLoading(false);
    }
  }, [get, id, translate]);

  useEffect(() => { load(); }, [load]);

  const setField = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const setFile = (key, file) => {
    setFiles((prev) => ({ ...prev, [key]: file }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('type', identifier);

      Object.entries(formData).forEach(([k, v]) => {
        if (typeof v === 'string' || typeof v === 'number') {
          fd.append(k, v);
        }
      });

      Object.entries(files).forEach(([k, f]) => {
        if (f) fd.append(k, f);
      });

      // Slider items for university/marketplace/meditation themes
      sliderItems.forEach((item, idx) => {
        if (item.type === 'image' && item.file) {
          fd.append(`slider_items[${idx}]`, item.file);
        } else if (item.type === 'video') {
          fd.append(`slider_items[${idx}]`, item.url || '');
        } else if (item.banner_title !== undefined) {
          fd.append(`banner_title${idx}`, item.banner_title || '');
          fd.append(`banner_description${idx}`, item.banner_description || '');
          if (item.image_file) fd.append(`image${idx}`, item.image_file);
          fd.append(`slider[]`, idx);
        }
      });

      await post(`/api/admin/settings/home-edit/${id}`, fd);
      toast.success(translate('Saved'));
      load();
    } catch {
      toast.error(translate('Failed to save'));
    } finally {
      setSaving(false);
    }
  };

  const addSliderItem = (type) => {
    setSliderItems((prev) => [...prev, { type, url: '', file: null, banner_title: '', banner_description: '', image_file: null }]);
  };

  const removeSliderItem = (idx) => {
    setSliderItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateSliderItem = (idx, key, value) => {
    setSliderItems((prev) => prev.map((item, i) => (i === idx ? { ...item, [key]: value } : item)));
  };

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <div className="bg-white border border-gray-100 rounded-lg mb-4">
        <div className="py-3 px-5 my-3">
          <h4 className="title text-base">
            <i className="fi-rr-settings-sliders mr-2" />
            {translate('Edit Homepage')} — {identifier}
          </h4>
        </div>
      </div>

      <div className="flex flex-wrap">
        <div className="w-full">
          <div className="bg-white border border-gray-100 rounded-lg p-4">
            <div className="">
              {/* Common fields: title, description, image */}
              {(identifier === 'cooking' || identifier === 'development' || identifier === 'kindergarden') && (
                <>
                  <h5 className="title mb-3 mt-2">
                    {identifier === 'cooking'
                      ? translate('Become An Instructor')
                      : translate('About Us')}
                  </h5>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{translate('Title')}</label>
                    <input
                      className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      type="text"
                      value={formData.title || ''}
                      onChange={(e) => setField('title', e.target.value)}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{translate('Description')}</label>
                    <textarea
                      className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      rows={3}
                      value={formData.description || ''}
                      onChange={(e) => setField('description', e.target.value)}
                    />
                  </div>
                  {identifier === 'cooking' && (
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">{translate('Video Url')}</label>
                      <input
                        className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        type="text"
                        value={formData.video_url || ''}
                        onChange={(e) => setField('video_url', e.target.value)}
                      />
                    </div>
                  )}
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{translate('Image')}</label>
                    {formData.image && (
                      <div className="mb-2">
                        <img src={getImage(formData.image)} alt="" style={{ maxHeight: 100 }} />
                      </div>
                    )}
                    <input
                      className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setFile('image', e.target.files[0] || null)}
                    />
                  </div>
                </>
              )}

              {/* University: about image + faq image + slider items */}
              {identifier === 'university' && (
                <>
                  <h5 className="title mb-3 mt-2">{translate('About Us Image')}</h5>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{translate('Image')}</label>
                    {formData.image && (
                      <div className="mb-2">
                        <img src={getImage(formData.image)} alt="" style={{ maxHeight: 100 }} />
                      </div>
                    )}
                    <input
                      className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setFile('image', e.target.files[0] || null)}
                    />
                  </div>

                  <h5 className="title mb-3 mt-4">{translate('Faq Image')}</h5>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{translate('Faq Image')}</label>
                    {formData.faq_image && (
                      <div className="mb-2">
                        <img src={getImage(formData.faq_image)} alt="" style={{ maxHeight: 100 }} />
                      </div>
                    )}
                    <input
                      className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setFile('faq_image', e.target.files[0] || null)}
                    />
                  </div>

                  <h5 className="title mb-3 mt-4">{translate('Slider image & video link')}</h5>
                  <div className="flex gap-2 mb-3">
                    <button className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-emerald-600 text-white hover:bg-emerald-700" type="button" onClick={() => addSliderItem('image')}>
                      <i className="fi-rr-plus-small mr-1" /> {translate('Add Image')}
                    </button>
                    <button className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-emerald-600 text-white hover:bg-emerald-700" type="button" onClick={() => addSliderItem('video')}>
                      <i className="fi-rr-plus-small mr-1" /> {translate('Add Video Link')}
                    </button>
                  </div>
                  {sliderItems.map((item, idx) => (
                    <div key={idx} className="flex border-t border-gray-200 items-center mt-2 pt-2">
                      <div className="flex-grow mb-3 px-2">
                        {item.type === 'image' || (!item.type && item.is_image) ? (
                          <div className="mb-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">{translate('Image')}</label>
                            {item.src && (
                              <img src={getImage(item.src)} width="50" className="mr-2" alt="" />
                            )}
                            <input
                              className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                              type="file"
                              accept="image/*"
                              onChange={(e) => updateSliderItem(idx, 'file', e.target.files[0] || null)}
                            />
                          </div>
                        ) : (
                          <div className="mb-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                              {translate('Video Link')} <small>({translate('Youtube')} & {translate('HTML5')})</small>
                            </label>
                            <input
                              className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                              type="text"
                              value={item.url || ''}
                              onChange={(e) => updateSliderItem(idx, 'url', e.target.value)}
                            />
                          </div>
                        )}
                      </div>
                      <button className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-red-500 text-white hover:bg-red-600" type="button" onClick={() => removeSliderItem(idx)}>
                        <i className="fi-rr-minus-small" />
                      </button>
                    </div>
                  ))}
                </>
              )}

              {/* Marketplace: instructor section + banner sliders */}
              {identifier === 'marketplace' && (
                <>
                  <h5 className="title mb-3 mt-2">{translate('Become An Instructor')}</h5>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{translate('Title')}</label>
                    <input
                      className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      type="text"
                      value={formData.title || ''}
                      onChange={(e) => setField('title', e.target.value)}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{translate('Description')}</label>
                    <textarea
                      className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      rows={3}
                      value={formData.description || ''}
                      onChange={(e) => setField('description', e.target.value)}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{translate('Video Url')}</label>
                    <input
                      className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      type="text"
                      value={formData.video_url || ''}
                      onChange={(e) => setField('video_url', e.target.value)}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{translate('Image')}</label>
                    {formData.image && (
                      <div className="mb-2">
                        <img src={getImage(formData.image)} alt="" style={{ maxHeight: 100 }} />
                      </div>
                    )}
                    <input
                      className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setFile('image', e.target.files[0] || null)}
                    />
                  </div>

                  <h5 className="title mb-3 mt-4">{translate('Banner Information')}</h5>
                  <button className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200 ol-icon-btn mb-3" type="button" onClick={() => addSliderItem('banner')}>
                    <i className="fi-rr-plus-small" /> {translate('Add new')}
                  </button>
                  {sliderItems.map((item, idx) => (
                    <div key={idx} className="flex mt-2 border-t border-gray-200 pt-2">
                      <div className="flex-grow mb-3 px-2">
                        <div className="mb-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">{translate('Title')}</label>
                          <input
                            className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            type="text"
                            value={item.banner_title || ''}
                            onChange={(e) => updateSliderItem(idx, 'banner_title', e.target.value)}
                          />
                        </div>
                        <div className="mb-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">{translate('Description')}</label>
                          <textarea
                            className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            value={item.banner_description || ''}
                            onChange={(e) => updateSliderItem(idx, 'banner_description', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="pt-4">
                        <button
                          className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200 ol-icon-btn mt-2"
                          type="button"
                          onClick={() => removeSliderItem(idx)}
                        >
                          <i className="fi-rr-minus-small" />
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* Meditation: big image + featured items */}
              {identifier === 'meditation' && (
                <>
                  <h5 className="title mb-3 mt-2">{translate('Meditation Big Image')}</h5>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{translate('Big Image')}</label>
                    {formData.big_image && (
                      <div className="mb-2">
                        <img src={getImage(formData.big_image)} alt="" style={{ maxHeight: 100 }} />
                      </div>
                    )}
                    <input
                      className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setFile('big_image', e.target.files[0] || null)}
                    />
                  </div>

                  <h5 className="title mb-3 mt-4">{translate('Meditation Featured')}</h5>
                  <button className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200 ol-icon-btn mb-3" type="button" onClick={() => addSliderItem('featured')}>
                    <i className="fi-rr-plus-small" /> {translate('Add new')}
                  </button>
                  {sliderItems.map((item, idx) => (
                    <div key={idx} className="flex mt-2 border-t border-gray-200 pt-2">
                      <div className="flex-grow mb-3 px-2">
                        <div className="mb-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">{translate('Title')}</label>
                          <input
                            className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            type="text"
                            value={item.banner_title || ''}
                            onChange={(e) => updateSliderItem(idx, 'banner_title', e.target.value)}
                          />
                        </div>
                        <div className="mb-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">{translate('Description')}</label>
                          <textarea
                            className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            value={item.banner_description || ''}
                            onChange={(e) => updateSliderItem(idx, 'banner_description', e.target.value)}
                          />
                        </div>
                        <div className="mb-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">{translate('Image')}</label>
                          {item.image && (
                            <img src={getImage(item.image)} width="50" className="mr-2" alt="" />
                          )}
                          <input
                            className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            type="file"
                            accept="image/*"
                            onChange={(e) => updateSliderItem(idx, 'image_file', e.target.files[0] || null)}
                          />
                        </div>
                      </div>
                      <div className="pt-4">
                        <button
                          className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200 ol-icon-btn mt-2"
                          type="button"
                          onClick={() => removeSliderItem(idx)}
                        >
                          <i className="fi-rr-minus-small" />
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* Elegant / Language themes: no special fields, just a note */}
              {!['cooking', 'university', 'development', 'kindergarden', 'marketplace', 'meditation'].includes(identifier) && identifier && (
                <p className="text-gray-500">{translate('No customizable fields for this theme.')}</p>
              )}

              <hr />
              <button
                className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-emerald-600 text-white hover:bg-emerald-700"
                type="button"
                disabled={saving}
                onClick={handleSave}
              >
                {saving ? translate('Saving...') : translate('Save changes')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
