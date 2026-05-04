/**
 * AdminCourseCreate — 1:1 port of admin/course/create.blade.php
 * Two-column create form (left: title/description/status; right: category/level/
 * language/pricing/expiry/drip/thumbnail) posted as multipart/form-data.
 */

import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useApi } from '@/hooks/useApi';
import { useSettings } from '@/contexts/SettingsContext';
import { API, ROUTES, buildRoute } from '@/config/routes';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active', dot: 'bg-emerald-500' },
  { value: 'private', label: 'Private', dot: 'bg-violet-500' },
  { value: 'upcoming', label: 'Upcoming', dot: 'bg-sky-500' },
  { value: 'pending', label: 'Pending', dot: 'bg-amber-500' },
  { value: 'draft', label: 'Draft', dot: 'bg-gray-400' },
  { value: 'inactive', label: 'Inactive', dot: 'bg-rose-500' },
];

const inputClass =
  'w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent';
const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5';
const errorClass = 'text-rose-500 text-xs mt-1';

export default function AdminCourseCreate() {
  const { translate } = useSettings();
  const { get, post } = useApi();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      title: '',
      short_description: '',
      description: '',
      status: 'active',
      category_id: '',
      level: '',
      language: '',
      is_paid: '1',
      price: '',
      discount_flag: false,
      discounted_price: '',
      expiry_period: 'lifetime',
      number_of_month: '',
      enable_drip_content: '0',
    },
  });

  const isPaid = watch('is_paid');
  const expiryPeriod = watch('expiry_period');

  const fetchOptions = useCallback(async () => {
    try {
      const [catRes, langRes] = await Promise.all([
        get(API.ADMIN_COURSE_CATEGORIES),
        get(API.ADMIN_LANGUAGES),
      ]);
      setCategories(catRes.data || catRes || []);
      setLanguages(langRes.data || langRes || []);
    } catch { /* non-fatal */ }
  }, [get]);

  useEffect(() => { fetchOptions(); }, [fetchOptions]);

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('course_type', 'general');
      fd.append('title', data.title);
      fd.append('short_description', data.short_description || '');
      fd.append('description', data.description || '');
      fd.append('status', data.status);
      fd.append('category_id', data.category_id);
      fd.append('level', data.level);
      fd.append('language', data.language);
      fd.append('is_paid', data.is_paid);
      if (data.is_paid === '1') {
        fd.append('price', data.price || '');
        fd.append('discount_flag', data.discount_flag ? '1' : '0');
        fd.append('discounted_price', data.discounted_price || '');
      }
      fd.append('expiry_period', data.expiry_period);
      if (data.expiry_period === 'limited_time') {
        fd.append('number_of_month', data.number_of_month || '');
      }
      fd.append('enable_drip_content', data.enable_drip_content);
      if (data.thumbnail?.[0]) fd.append('thumbnail', data.thumbnail[0]);

      const res = await post(API.ADMIN_COURSE_STORE, fd);
      toast.success(translate('Course created successfully'));
      const courseId = res.data?.id || res.id;
      if (courseId) {
        navigate(buildRoute(ROUTES.ADMIN_COURSE_EDIT, { id: courseId }));
      } else {
        navigate(ROUTES.ADMIN_COURSES);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || translate('Failed to create course'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h4 className="flex items-center gap-2 text-base font-semibold text-gray-900">
            <i className="fi-rr-settings-sliders text-emerald-600" />
            {translate('Add new Course')}
          </h4>
          <Link
            to={ROUTES.ADMIN_COURSES}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <i className="fi-rr-arrow-left" />
            <span>{translate('Back')}</span>
          </Link>
        </div>
      </div>

      {/* Form card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left */}
          <div className="space-y-4">
            <div>
              <label className={labelClass} htmlFor="title">
                {translate('Title')} <span className="text-rose-500">*</span>
              </label>
              <input
                id="title"
                type="text"
                className={`${inputClass} ${errors.title ? 'border-rose-400' : ''}`}
                placeholder={translate('Enter Course Title')}
                {...register('title', { required: translate('Title is required') })}
              />
              {errors.title && <div className={errorClass}>{errors.title.message}</div>}
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
                rows={8}
                className={inputClass}
                placeholder={translate('Enter Description')}
                {...register('description')}
              />
            </div>

            <div>
              <label className={labelClass}>
                {translate('Create as')} <span className="text-rose-500">*</span>
              </label>
              <div className="flex flex-wrap gap-3">
                {STATUS_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-700 hover:border-emerald-400 cursor-pointer has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50"
                  >
                    <input
                      type="radio"
                      className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-gray-300"
                      value={opt.value}
                      {...register('status', { required: true })}
                    />
                    <span className={`inline-block w-2 h-2 rounded-full ${opt.dot}`} />
                    <span>{translate(opt.label)}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="space-y-4">
            <div>
              <label className={labelClass} htmlFor="category_id">
                {translate('Category')} <span className="text-rose-500">*</span>
              </label>
              <select
                id="category_id"
                className={`${inputClass} ${errors.category_id ? 'border-rose-400' : ''}`}
                {...register('category_id', { required: translate('Category is required') })}
              >
                <option value="">{translate('Select a category')}</option>
                {categories.map((cat) => (
                  <optgroup key={cat.id} label={cat.title}>
                    <option value={cat.id}>{cat.title}</option>
                    {cat.children?.map((sub) => (
                      <option key={sub.id} value={sub.id}>-- {sub.title}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
              {errors.category_id && <div className={errorClass}>{errors.category_id.message}</div>}
            </div>

            <div>
              <label className={labelClass} htmlFor="level">
                {translate('Course level')} <span className="text-rose-500">*</span>
              </label>
              <select
                id="level"
                className={`${inputClass} ${errors.level ? 'border-rose-400' : ''}`}
                {...register('level', { required: translate('Level is required') })}
              >
                <option value="">{translate('Select your course level')}</option>
                <option value="beginner">{translate('Beginner')}</option>
                <option value="intermediate">{translate('Intermediate')}</option>
                <option value="advanced">{translate('Advanced')}</option>
              </select>
              {errors.level && <div className={errorClass}>{errors.level.message}</div>}
            </div>

            <div>
              <label className={labelClass} htmlFor="language">
                {translate('Made in')} <span className="text-rose-500">*</span>
              </label>
              <select
                id="language"
                className={`${inputClass} ${errors.language ? 'border-rose-400' : ''}`}
                {...register('language', { required: translate('Language is required') })}
              >
                <option value="">{translate('Select your course language')}</option>
                {languages.map((lang) => (
                  <option key={lang.id || lang.name} value={lang.name?.toLowerCase()}>
                    {lang.name}
                  </option>
                ))}
              </select>
              {errors.language && <div className={errorClass}>{errors.language.message}</div>}
            </div>

            <div>
              <label className={labelClass}>
                {translate('Pricing type')} <span className="text-rose-500">*</span>
              </label>
              <div className="flex gap-3">
                <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-700 hover:border-emerald-400 cursor-pointer has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50">
                  <input type="radio" value="1" className="w-4 h-4 text-emerald-600" {...register('is_paid')} />
                  <span>{translate('Paid')}</span>
                </label>
                <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-700 hover:border-emerald-400 cursor-pointer has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50">
                  <input type="radio" value="0" className="w-4 h-4 text-emerald-600" {...register('is_paid')} />
                  <span>{translate('Free')}</span>
                </label>
              </div>
            </div>

            {isPaid === '1' && (
              <div className="space-y-3 rounded-lg border border-gray-100 bg-gray-50 p-4">
                <div>
                  <label className={labelClass} htmlFor="price">
                    {translate('Price')} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="price"
                    type="number"
                    min="1"
                    step=".01"
                    className={inputClass}
                    placeholder={translate('Enter your course price')}
                    {...register('price')}
                  />
                </div>
                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" className="w-4 h-4 text-emerald-600 rounded" {...register('discount_flag')} />
                  {translate('Check if this course has discount')}
                </label>
                <div>
                  <label className={labelClass} htmlFor="discounted_price">
                    {translate('Discounted price')}
                  </label>
                  <input
                    id="discounted_price"
                    type="number"
                    min="1"
                    step=".01"
                    className={inputClass}
                    placeholder={translate('Enter your discount price')}
                    {...register('discounted_price')}
                  />
                </div>
              </div>
            )}

            <div>
              <label className={labelClass}>{translate('Expiry period')}</label>
              <div className="flex gap-3">
                <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-700 hover:border-emerald-400 cursor-pointer has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50">
                  <input type="radio" value="lifetime" className="w-4 h-4 text-emerald-600" {...register('expiry_period')} />
                  <span>{translate('Lifetime')}</span>
                </label>
                <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-700 hover:border-emerald-400 cursor-pointer has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50">
                  <input type="radio" value="limited_time" className="w-4 h-4 text-emerald-600" {...register('expiry_period')} />
                  <span>{translate('Limited time')}</span>
                </label>
              </div>
            </div>

            {expiryPeriod === 'limited_time' && (
              <div>
                <label className={labelClass}>{translate('Number of month')}</label>
                <input
                  type="number"
                  min="1"
                  className={inputClass}
                  placeholder={translate('After purchase, students can access the course until your selected month.')}
                  {...register('number_of_month')}
                />
              </div>
            )}

            <div>
              <label className={labelClass}>
                {translate('Enable drip content')} <span className="text-rose-500">*</span>
              </label>
              <div className="flex gap-3">
                <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-700 hover:border-emerald-400 cursor-pointer has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50">
                  <input type="radio" value="0" className="w-4 h-4 text-emerald-600" {...register('enable_drip_content')} />
                  <span>{translate('Off')}</span>
                </label>
                <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-700 hover:border-emerald-400 cursor-pointer has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50">
                  <input type="radio" value="1" className="w-4 h-4 text-emerald-600" {...register('enable_drip_content')} />
                  <span>{translate('On')}</span>
                </label>
              </div>
            </div>

            <div>
              <label className={labelClass} htmlFor="thumbnail">{translate('Thumbnail')}</label>
              <input
                id="thumbnail"
                type="file"
                accept="image/*"
                className={inputClass}
                {...register('thumbnail')}
              />
            </div>
          </div>

          {/* Submit — spans both cols */}
          <div className="md:col-span-2 flex justify-end pt-2 border-t border-gray-100">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {submitting ? translate('Saving...') : translate('Submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
