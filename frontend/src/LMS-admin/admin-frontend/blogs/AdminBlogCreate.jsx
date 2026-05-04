/**
 * AdminBlogCreate - Create a new blog post.
 *
 * ============================================================================
 * ORIGINAL BLADE: resources/views/admin/blog/create.blade.php
 * ============================================================================
 *
 * Form fields: title, category, keywords (comma-separated tags), description
 * (rich text), banner image, thumbnail image, is_popular toggle.
 */

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useApi } from '@/hooks/useApi';
import { useSettings } from '@/contexts/SettingsContext';
import { API, ROUTES } from '@/config/routes';

export default function AdminBlogCreate() {
  const { translate } = useSettings();
  const { get, post } = useApi();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [saving, setSaving] = useState(false);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { title: '', category_id: '', keywords: '', description: '', is_popular: '0' },
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await get(API.ADMIN_BLOG_CATEGORIES);
        setCategories(res.data || res || []);
      } catch { /* categories may be empty */ }
    })();
  }, [get]);

  const onBannerChange = (e) => {
    const file = e.target.files[0];
    if (file) setBannerPreview(URL.createObjectURL(file));
  };

  const onThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file) setThumbnailPreview(URL.createObjectURL(file));
  };

  const onSubmit = async (values) => {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('title', values.title);
      fd.append('category_id', values.category_id);
      fd.append('keywords', values.keywords || '');
      fd.append('description', values.description || '');
      fd.append('is_popular', values.is_popular);
      if (values.banner?.[0]) fd.append('banner', values.banner[0]);
      if (values.thumbnail?.[0]) fd.append('thumbnail', values.thumbnail[0]);

      await post(API.ADMIN_BLOG_STORE, fd);
      toast.success(translate('Blog created'));
      navigate(ROUTES.ADMIN_BLOGS);
    } catch (err) {
      toast.error(err?.response?.data?.message || translate('Failed to create blog'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="ol-card radius-8px">
        <div className="ol-card-body py-12px px-20px my-3">
          <div className="flex items-center justify-between flex-md-nowrap flex-wrap gap-3">
            <h4 className="title text-base">
              <i className="fi-rr-settings-sliders mr-2" />
              <span>{translate('Add Blog')}</span>
            </h4>
            <Link
              to={ROUTES.ADMIN_BLOGS}
              className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors border border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center cg-10px"
            >
              <span className="fi-rr-arrow-left" />
              <span>{translate('Back')}</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap -mx-3">
        <div className="w-full md:w-8/12">
          <div className="ol-card p-4">
            <div className="ol-card-body">
              <form onSubmit={handleSubmit(onSubmit)} encType="multipart/form-data">
                <div className="fpb-7 mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 block text-sm font-medium text-gray-700 mb-1.5" htmlFor="title">
                    {translate('Title')} <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="title"
                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    type="text"
                    placeholder={translate('Enter blog title')}
                    {...register('title', { required: true })}
                  />
                  {errors.title && <small className="text-red-600">{translate('Title is required')}</small>}
                </div>

                <div className="fpb-7 mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 block text-sm font-medium text-gray-700 mb-1.5" htmlFor="category_id">
                    {translate('Category')} <span className="text-red-600">*</span>
                  </label>
                  <select
                    id="category_id"
                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    {...register('category_id', { required: true })}
                  >
                    <option value="">{translate('Select a category')}</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.title}</option>
                    ))}
                  </select>
                  {errors.category_id && <small className="text-red-600">{translate('Category is required')}</small>}
                </div>

                <div className="fpb-7 mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 block text-sm font-medium text-gray-700 mb-1.5" htmlFor="keywords">
                    {translate('Keywords')}
                  </label>
                  <input
                    id="keywords"
                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    type="text"
                    placeholder={translate('Comma-separated keywords')}
                    {...register('keywords')}
                  />
                  <small className="text-gray-500">{translate('Separate keywords with commas')}</small>
                </div>

                <div className="fpb-7 mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 block text-sm font-medium text-gray-700 mb-1.5" htmlFor="description">
                    {translate('Description')}
                  </label>
                  <textarea
                    id="description"
                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    rows="8"
                    {...register('description')}
                  />
                </div>

                <div className="flex flex-wrap -mx-3">
                  <div className="w-full md:w-1/2 fpb-7 mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5 block text-sm font-medium text-gray-700 mb-1.5" htmlFor="banner">
                      {translate('Blog banner')}
                    </label>
                    {bannerPreview && (
                      <div className="mb-2" style={{ width: '100%', height: 200, borderRadius: 8, overflow: 'hidden' }}>
                        <img src={bannerPreview} alt="banner preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    )}
                    <input
                      id="banner"
                      className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      type="file"
                      accept="image/*"
                      {...register('banner')}
                      onChange={(e) => { register('banner').onChange(e); onBannerChange(e); }}
                    />
                  </div>

                  <div className="w-full md:w-1/2 fpb-7 mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5 block text-sm font-medium text-gray-700 mb-1.5" htmlFor="thumbnail">
                      {translate('Blog thumbnail')}
                    </label>
                    {thumbnailPreview && (
                      <div className="mb-2" style={{ width: '100%', height: 200, borderRadius: 8, overflow: 'hidden' }}>
                        <img src={thumbnailPreview} alt="thumbnail preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    )}
                    <input
                      id="thumbnail"
                      className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      type="file"
                      accept="image/*"
                      {...register('thumbnail')}
                      onChange={(e) => { register('thumbnail').onChange(e); onThumbnailChange(e); }}
                    />
                  </div>
                </div>

                <div className="fpb-7 mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 block text-sm font-medium text-gray-700 mb-1.5">
                    {translate('Would you like to designate it as popular?')}
                  </label>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                      <input id="mark_yes" type="radio" value="1" {...register('is_popular')} />
                      <label htmlFor="mark_yes">{translate('Yes')}</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input id="mark_no" type="radio" value="0" {...register('is_popular')} />
                      <label htmlFor="mark_no">{translate('No')}</label>
                    </div>
                  </div>
                </div>

                <div className="fpb-7 mb-3">
                  <button className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-indigo-600 text-white hover:bg-indigo-700" type="submit" disabled={saving}>
                    {saving ? translate('Saving...') : translate('Add blog')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
