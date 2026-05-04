/**
 * AdminBootcampCreate — 1:1 port of admin/bootcamp/create.blade.php.
 * Single-page form: title, descriptions, category, pricing, thumbnail, publish date.
 */

import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useApi } from '@/hooks/useApi';
import { useSettings } from '@/contexts/SettingsContext';
import { API, ROUTES, buildRoute } from '@/config/routes';

const inputClass =
  'w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent';
const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5';

export default function AdminBootcampCreate() {
  const { translate, getSetting } = useSettings();
  const currencySymbol = getSetting('currency_symbol') || '';
  const { get, post } = useApi();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      title: '',
      short_description: '',
      description: '',
      category_id: '',
      is_paid: '1',
      price: '',
      discount_flag: false,
      discounted_price: '',
      publish_date: '',
    },
  });

  const isPaid = watch('is_paid');
  const discountFlag = watch('discount_flag');

  const fetchCategories = useCallback(async () => {
    try {
      const res = await get(API.ADMIN_BOOTCAMP_CATEGORIES);
      setCategories(res.data || res || []);
    } catch {
      toast.error(translate('Failed to load categories'));
    }
  }, [get, translate]);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const onThumbChange = (e) => {
    const file = e.target.files?.[0];
    setThumbnailPreview(file ? URL.createObjectURL(file) : null);
  };

  const onSubmit = async (values) => {
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('title', values.title);
      fd.append('short_description', values.short_description || '');
      fd.append('description', values.description || '');
      fd.append('category_id', values.category_id);
      fd.append('is_paid', values.is_paid);
      fd.append('price', values.is_paid === '1' ? (values.price || '') : '');
      fd.append('discount_flag', values.discount_flag ? '1' : '0');
      fd.append('discounted_price', values.discount_flag ? (values.discounted_price || '') : '');
      if (values.publish_date) fd.append('publish_date', values.publish_date);
      if (values.thumbnail?.[0]) fd.append('thumbnail', values.thumbnail[0]);

      const res = await post(API.ADMIN_BOOTCAMP_STORE, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success(translate('Bootcamp has been created successfully.'));
      const id = res?.data?.id || res?.id;
      if (id) {
        navigate(buildRoute(ROUTES.ADMIN_BOOTCAMP_EDIT, { id }) + '?tab=curriculum');
      } else {
        navigate(ROUTES.ADMIN_BOOTCAMPS);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || translate('Failed to create bootcamp'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Page header */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h4 className="flex items-center gap-2 text-base font-semibold text-gray-900">
            <i className="fi-rr-settings-sliders text-emerald-600" />
            <span>{translate('Add new Bootcamp')}</span>
          </h4>
          <Link
            to={ROUTES.ADMIN_BOOTCAMPS}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <i className="fi-rr-arrow-left" />
            <span>{translate('Back')}</span>
          </Link>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} encType="multipart/form-data">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Left column */}
            <div className="space-y-4">
              <div>
                <label className={labelClass} htmlFor="title">
                  {translate('Title')}<span className="text-rose-500 ml-1">*</span>
                </label>
                <input
                  id="title"
                  type="text"
                  className={`${inputClass} ${errors.title ? 'border-rose-400' : ''}`}
                  placeholder={translate('Enter Bootcamp Title')}
                  {...register('title', { required: true })}
                />
              </div>

              <div>
                <label className={labelClass} htmlFor="short_description">
                  {translate('Short Description')}
                </label>
                <textarea
                  id="short_description"
                  rows={5}
                  className={inputClass}
                  placeholder={translate('Enter Short Description')}
                  {...register('short_description')}
                />
              </div>

              <div>
                <label className={labelClass} htmlFor="description">
                  {translate('Description')}
                </label>
                <textarea
                  id="description"
                  rows={6}
                  className={inputClass}
                  placeholder={translate('Enter Description')}
                  {...register('description')}
                />
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-4">
              <div>
                <label className={labelClass} htmlFor="category_id">
                  {translate('Category')}<span className="text-rose-500 ml-1">*</span>
                </label>
                <select
                  id="category_id"
                  className={`${inputClass} ${errors.category_id ? 'border-rose-400' : ''}`}
                  {...register('category_id', { required: true })}
                >
                  <option value="">{translate('Select a category')}</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>
                  {translate('Pricing type')}<span className="text-rose-500 ml-1">*</span>
                </label>
                <div className="flex items-center gap-4">
                  <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="radio"
                      value="1"
                      className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                      {...register('is_paid')}
                    />
                    {translate('Paid')}
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="radio"
                      value="0"
                      className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                      {...register('is_paid')}
                    />
                    {translate('Free')}
                  </label>
                </div>
              </div>

              {isPaid === '1' && (
                <div className="space-y-4 border border-gray-100 rounded-lg p-3 bg-gray-50">
                  <div>
                    <label className={labelClass} htmlFor="price">
                      {translate('Price')} <small className="text-gray-500">({currencySymbol || ''})</small>
                      <span className="text-rose-500 ml-1">*</span>
                    </label>
                    <input
                      id="price"
                      type="number"
                      min="1"
                      step="0.01"
                      className={inputClass}
                      placeholder={translate('Enter your bootcamp price')}
                      {...register('price', { required: isPaid === '1' })}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      id="discount_flag"
                      type="checkbox"
                      className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      {...register('discount_flag')}
                    />
                    <label htmlFor="discount_flag" className="text-sm text-gray-700">
                      {translate('Check if this bootcamp has discount')}
                    </label>
                  </div>

                  {discountFlag && (
                    <div>
                      <label className={labelClass} htmlFor="discounted_price">
                        {translate('Discounted price')}
                      </label>
                      <input
                        id="discounted_price"
                        type="number"
                        min="1"
                        step="0.01"
                        className={inputClass}
                        placeholder={translate('Enter your discount price')}
                        {...register('discounted_price')}
                      />
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className={labelClass} htmlFor="thumbnail">{translate('Thumbnail')}</label>
                {thumbnailPreview && (
                  <img
                    src={thumbnailPreview}
                    alt=""
                    className="mb-2 rounded-lg w-full max-h-40 object-cover border border-gray-100"
                  />
                )}
                <input
                  id="thumbnail"
                  type="file"
                  accept="image/*"
                  className={inputClass}
                  {...register('thumbnail', { onChange: onThumbChange })}
                />
              </div>

              <div>
                <label className={labelClass} htmlFor="publish_date">{translate('Publish Date')}</label>
                <input
                  id="publish_date"
                  type="date"
                  className={inputClass}
                  {...register('publish_date')}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-5 mt-5 border-t border-gray-100">
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {submitting ? translate('Submitting...') : translate('Submit')}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
