/**
 * AdminBlogEdit - Edit an existing blog post with SEO fields.
 *
 * ============================================================================
 * ORIGINAL BLADE: resources/views/admin/blog/edit.blade.php
 * ============================================================================
 *
 * Form fields: title, category, keywords, description, banner, thumbnail,
 * is_popular, plus SEO section (meta_title, meta_keywords, meta_description,
 * meta_robot, canonical_url, custom_url, og_title, og_description, og_image,
 * json_ld).
 */

import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useApi } from '@/hooks/useApi';
import { useSettings } from '@/contexts/SettingsContext';
import { API, ROUTES } from '@/config/routes';

export default function AdminBlogEdit() {
  const { id } = useParams();
  const { translate, getImage } = useSettings();
  const { get, post } = useApi();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [saving, setSaving] = useState(false);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [blogRes, catRes] = await Promise.all([
          get(API.ADMIN_BLOG(id)),
          get(API.ADMIN_BLOG_CATEGORIES),
        ]);
        const blog = blogRes.data || blogRes;
        setCategories(catRes.data || catRes || []);

        if (blog.banner) setBannerPreview(getImage(blog.banner));
        if (blog.thumbnail) setThumbnailPreview(getImage(blog.thumbnail));

        const seo = blog.seo || {};
        reset({
          title: blog.title || '',
          category_id: blog.category_id || '',
          keywords: blog.keywords || '',
          description: blog.description || '',
          is_popular: String(blog.is_popular ?? '0'),
          // SEO
          meta_title: seo.meta_title || '',
          meta_keywords: seo.meta_keywords || '',
          meta_description: seo.meta_description || '',
          meta_robot: seo.meta_robot || '',
          canonical_url: seo.canonical_url || '',
          custom_url: seo.custom_url || '',
          og_title: seo.og_title || '',
          og_description: seo.og_description || '',
          json_ld: seo.json_ld || '',
        });
      } catch {
        toast.error(translate('Failed to load blog'));
      } finally {
        setLoading(false);
      }
    })();
  }, [get, id, reset, translate, getImage]);

  const onSubmit = async (values) => {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('_method', 'PUT');
      const textFields = [
        'title', 'category_id', 'keywords', 'description', 'is_popular',
        'meta_title', 'meta_keywords', 'meta_description', 'meta_robot',
        'canonical_url', 'custom_url', 'og_title', 'og_description', 'json_ld',
      ];
      textFields.forEach((k) => fd.append(k, values[k] ?? ''));
      if (values.banner?.[0]) fd.append('banner', values.banner[0]);
      if (values.thumbnail?.[0]) fd.append('thumbnail', values.thumbnail[0]);
      if (values.og_image?.[0]) fd.append('og_image', values.og_image[0]);

      await post(API.ADMIN_BLOG_UPDATE(id), fd);
      toast.success(translate('Blog updated'));
      navigate(ROUTES.ADMIN_BLOGS);
    } catch (err) {
      toast.error(err?.response?.data?.message || translate('Failed to update blog'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <div className="ol-card radius-8px">
        <div className="ol-card-body py-12px px-20px my-3">
          <div className="flex items-center justify-between flex-md-nowrap flex-wrap gap-3">
            <h4 className="title text-base">
              <i className="fi-rr-settings-sliders mr-2" />
              <span>{translate('Update Blog')}</span>
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
        <div className="w-full md:w-10/12">
          <div className="ol-card p-4">
            <div className="ol-card-body">
              <form onSubmit={handleSubmit(onSubmit)} encType="multipart/form-data">
                {/* ── Blog fields ─────────────────────────────────── */}
                <div className="fpb-7 mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 block text-sm font-medium text-gray-700 mb-1.5" htmlFor="title">
                    {translate('Title')} <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="title"
                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    type="text"
                    {...register('title', { required: true })}
                  />
                  {errors.title && <small className="text-red-600">{translate('Required')}</small>}
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
                </div>

                <div className="fpb-7 mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 block text-sm font-medium text-gray-700 mb-1.5">{translate('Keywords')}</label>
                  <input
                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    type="text"
                    {...register('keywords')}
                  />
                  <small className="text-gray-500">{translate('Separate keywords with commas')}</small>
                </div>

                <div className="fpb-7 mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 block text-sm font-medium text-gray-700 mb-1.5">{translate('Description')}</label>
                  <textarea className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" rows="8" {...register('description')} />
                </div>

                <div className="flex flex-wrap -mx-3">
                  <div className="w-full md:w-1/2 fpb-7 mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5 block text-sm font-medium text-gray-700 mb-1.5">{translate('Blog banner')}</label>
                    {bannerPreview && (
                      <div className="mb-2" style={{ width: '100%', height: 200, borderRadius: 8, overflow: 'hidden' }}>
                        <img src={bannerPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    )}
                    <input
                      className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      type="file"
                      accept="image/*"
                      {...register('banner')}
                      onChange={(e) => {
                        register('banner').onChange(e);
                        if (e.target.files[0]) setBannerPreview(URL.createObjectURL(e.target.files[0]));
                      }}
                    />
                  </div>
                  <div className="w-full md:w-1/2 fpb-7 mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5 block text-sm font-medium text-gray-700 mb-1.5">{translate('Blog thumbnail')}</label>
                    {thumbnailPreview && (
                      <div className="mb-2" style={{ width: '100%', height: 200, borderRadius: 8, overflow: 'hidden' }}>
                        <img src={thumbnailPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    )}
                    <input
                      className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      type="file"
                      accept="image/*"
                      {...register('thumbnail')}
                      onChange={(e) => {
                        register('thumbnail').onChange(e);
                        if (e.target.files[0]) setThumbnailPreview(URL.createObjectURL(e.target.files[0]));
                      }}
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

                {/* ── SEO Fields ──────────────────────────────────── */}
                <hr className="my-4" />
                <h3 className="title text-base mb-3">{translate('SEO Fields')}</h3>

                <div className="fpb-7 mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 block text-sm font-medium text-gray-700 mb-1.5">{translate('Meta Title')}</label>
                  <input className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" type="text" {...register('meta_title')} />
                </div>

                <div className="fpb-7 mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 block text-sm font-medium text-gray-700 mb-1.5">{translate('Meta Keywords')}</label>
                  <input className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" type="text" {...register('meta_keywords')} />
                </div>

                <div className="fpb-7 mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 block text-sm font-medium text-gray-700 mb-1.5">{translate('Meta Description')}</label>
                  <textarea className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" rows="3" {...register('meta_description')} />
                </div>

                <div className="fpb-7 mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 block text-sm font-medium text-gray-700 mb-1.5">{translate('Meta Robot')}</label>
                  <input className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" type="text" {...register('meta_robot')} />
                </div>

                <div className="fpb-7 mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 block text-sm font-medium text-gray-700 mb-1.5">{translate('Canonical URL')}</label>
                  <input className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" type="text" {...register('canonical_url')} />
                </div>

                <div className="fpb-7 mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 block text-sm font-medium text-gray-700 mb-1.5">{translate('Custom URL')}</label>
                  <input className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" type="text" {...register('custom_url')} />
                </div>

                <div className="fpb-7 mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 block text-sm font-medium text-gray-700 mb-1.5">{translate('OG Title')}</label>
                  <input className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" type="text" {...register('og_title')} />
                </div>

                <div className="fpb-7 mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 block text-sm font-medium text-gray-700 mb-1.5">{translate('OG Description')}</label>
                  <textarea className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" rows="3" {...register('og_description')} />
                </div>

                <div className="fpb-7 mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 block text-sm font-medium text-gray-700 mb-1.5">{translate('OG Image')}</label>
                  <input className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" type="file" accept="image/*" {...register('og_image')} />
                </div>

                <div className="fpb-7 mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 block text-sm font-medium text-gray-700 mb-1.5">{translate('JSON-LD')}</label>
                  <textarea className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" rows="4" {...register('json_ld')} />
                </div>

                <div className="fpb-7 mb-3">
                  <button className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-indigo-600 text-white hover:bg-indigo-700" type="submit" disabled={saving}>
                    {saving ? translate('Saving...') : translate('Update blog')}
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
