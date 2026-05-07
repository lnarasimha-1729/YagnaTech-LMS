/**
 * AdminTeamPackageForm — port of admin/team_training/create.blade.php + edit.blade.php.
 * Create or edit a team training package: title, course (by privacy), allocation,
 * pricing type, expiry, thumbnail upload, dynamic feature list.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useApi } from '@/hooks/useApi';
import { useSettings } from '@/contexts/SettingsContext';
import { API } from '@/config/routes';

const inputClass =
  'w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent';
const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5';

function toYmd(value) {
  if (!value) return '';
  const n = Number(value);
  const d = Number.isFinite(n) && n > 1e9 ? new Date(n * 1000) : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

export default function AdminTeamPackageForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { translate, getSetting } = useSettings();
  const { get, post } = useApi();
  const navigate = useNavigate();
  const currencySymbol = (getSetting && getSetting('currency_symbol')) || '';

  const [loading, setLoading] = useState(isEdit);
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [coursePriceMap, setCoursePriceMap] = useState({});
  const [thumbPreview, setThumbPreview] = useState('');

  const { register, handleSubmit, control, watch, reset, setValue, formState: { isSubmitting } } =
    useForm({
      defaultValues: {
        title: '',
        course_privacy: '',
        course_id: '',
        allocation: '',
        pricing_type: '1',
        price: '',
        expiry_type: 'limited',
        start_date: '',
        expiry_date: '',
        features: [''],
      },
    });

  const { fields, append, remove } = useFieldArray({ control, name: 'features' });

  const coursePrivacy = watch('course_privacy');
  const courseId = watch('course_id');
  const allocation = watch('allocation');
  const pricingType = watch('pricing_type');
  const expiryType = watch('expiry_type');
  const priceVal = watch('price');

  const loadCoursesByPrivacy = useCallback(
    async (privacy) => {
      if (!privacy) return;
      setLoadingCourses(true);
      try {
        const res = await get(API.ADMIN_COURSES_BY_PRIVACY, { params: { privacy } });
        setCourses(res.data || res || []);
      } catch {
        setCourses([]);
      } finally {
        setLoadingCourses(false);
      }
    },
    [get]
  );

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const res = await get(API.ADMIN_TEAM_PACKAGE(id));
        const pkg = res.data || res;
        const features = Array.isArray(pkg.features)
          ? pkg.features
          : pkg.features
            ? JSON.parse(pkg.features)
            : [];
        reset({
          title: pkg.title || '',
          course_privacy: pkg.course_privacy || '',
          course_id: pkg.course_id || '',
          allocation: pkg.allocation ?? '',
          pricing_type: String(pkg.pricing_type ?? '1'),
          price: pkg.price ?? '',
          expiry_type: pkg.expiry_type || 'limited',
          start_date: toYmd(pkg.start_date),
          expiry_date: toYmd(pkg.expiry_date),
          features: features.length ? features : [''],
        });
        if (pkg.course_privacy) loadCoursesByPrivacy(pkg.course_privacy);
        if (pkg.course_id && pkg.course_price != null) {
          setCoursePriceMap((m) => ({ ...m, [pkg.course_id]: pkg.course_price }));
        }
        if (pkg.thumbnail) setThumbPreview(pkg.thumbnail);
      } catch {
        toast.error(translate('Failed to load package'));
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isEdit, get, reset, loadCoursesByPrivacy, translate]);

  useEffect(() => {
    if (!isEdit && coursePrivacy) loadCoursesByPrivacy(coursePrivacy);
  }, [coursePrivacy, isEdit, loadCoursesByPrivacy]);

  useEffect(() => {
    if (!courseId || coursePriceMap[courseId] != null) return;
    (async () => {
      try {
        const res = await get(API.ADMIN_COURSE_PRICE, { params: { course_id: courseId } });
        const price = Number(res.price ?? res.data?.price ?? res);
        setCoursePriceMap((m) => ({ ...m, [courseId]: Number.isFinite(price) ? price : 0 }));
      } catch {
        setCoursePriceMap((m) => ({ ...m, [courseId]: 0 }));
      }
    })();
  }, [courseId, coursePriceMap, get]);

  const estimatedPrice = useMemo(() => {
    const cp = Number(coursePriceMap[courseId] || 0);
    const n = Number(allocation || 0);
    return cp * n;
  }, [courseId, coursePriceMap, allocation]);

  const discountRate = useMemo(() => {
    const est = Number(estimatedPrice);
    const p = Number(priceVal);
    if (!est || !p) return '0%';
    const rate = 100 - (100 / est) * p;
    return `${rate.toFixed(2)}%`;
  }, [estimatedPrice, priceVal]);

  const onThumbChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setThumbPreview(url);
  };

  const onSubmit = async (values) => {
    const fd = new FormData();
    fd.append('title', values.title);
    fd.append('course_privacy', values.course_privacy);
    fd.append('course_id', values.course_id);
    fd.append('allocation', values.allocation);
    fd.append('pricing_type', values.pricing_type);
    if (values.pricing_type === '1') {
      fd.append('price', values.price || '0');
      fd.append('expiry_type', values.expiry_type);
      if (values.expiry_type === 'limited') {
        if (values.start_date) fd.append('start_date', values.start_date);
        if (values.expiry_date) fd.append('expiry_date', values.expiry_date);
      }
    }
    (values.features || []).filter(Boolean).forEach((f) => fd.append('features[]', f));
    const thumb = document.getElementById('team-thumbnail')?.files?.[0];
    if (thumb) fd.append('thumbnail', thumb);

    try {
      if (isEdit) {
        fd.append('_method', 'PUT');
        await post(API.ADMIN_TEAM_PACKAGE(id), fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success(translate('Package updated'));
      } else {
        await post(API.ADMIN_TEAM_PACKAGES, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success(translate('Package created'));
      }
      navigate('/admin/team-packages');
    } catch (err) {
      toast.error(err?.response?.data?.message || translate('Failed to save'));
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <div className="bg-white border border-gray-100 rounded-lg mb-4">
        <div className="px-5 py-3">
          <h4 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <i className="fi-rr-settings-sliders" />
            {isEdit ? translate('Edit Team Package') : translate('Add New Package')}
          </h4>
        </div>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white border border-gray-100 rounded-lg p-5 space-y-4"
        encType="multipart/form-data"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-4">
            <div>
              <label className={labelClass} htmlFor="title">
                {translate('Title')} <span className="text-rose-500">*</span>
              </label>
              <input
                id="title"
                type="text"
                placeholder={translate('Enter package title')}
                className={inputClass}
                {...register('title', { required: true })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1">
                <label className={labelClass}>
                  {translate('Course')} <span className="text-rose-500">*</span>
                </label>
                <select
                  className={inputClass}
                  {...register('course_privacy', { required: true })}
                >
                  <option value="">{translate('Select course privacy')}</option>
                  <option value="public">{translate('Public')}</option>
                  <option value="private">{translate('Private')}</option>
                </select>
              </div>
              <div className="sm:col-span-2 flex items-end">
                <div className="w-full">
                  <label className={labelClass}>&nbsp;</label>
                  <select
                    className={inputClass}
                    disabled={!coursePrivacy || loadingCourses}
                    {...register('course_id', { required: true })}
                  >
                    <option value="">
                      {coursePrivacy
                        ? translate('Select a course')
                        : translate('First select course privacy')}
                    </option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelClass} htmlFor="allocation">
                  {translate('Allocation')} <span className="text-rose-500">*</span>
                </label>
                <input
                  id="allocation"
                  type="number"
                  min={1}
                  placeholder={translate('Enter package allocation')}
                  className={inputClass}
                  {...register('allocation', { required: true, min: 1 })}
                />
              </div>
              <div>
                <label className={labelClass}>{translate('Estimated Price')}</label>
                <input
                  type="number"
                  readOnly
                  value={estimatedPrice || ''}
                  placeholder={currencySymbol}
                  className={`${inputClass} bg-gray-50`}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>
                {translate('Pricing type')} <span className="text-rose-500">*</span>
              </label>
              <div className="flex gap-6">
                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input type="radio" value="1" {...register('pricing_type')} />
                  {translate('Paid')}
                </label>
                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input type="radio" value="0" {...register('pricing_type')} />
                  {translate('Free')}
                </label>
              </div>
            </div>

            {pricingType === '1' && (
              <div className="space-y-4 pt-2 border-t border-gray-100">
                <div>
                  <label className={labelClass} htmlFor="price">
                    {translate('Price')} <small className="text-gray-400">({currencySymbol})</small>
                    <span className="text-rose-500 ml-1">*</span>
                  </label>
                  <input
                    id="price"
                    type="number"
                    min="1"
                    step="0.01"
                    placeholder={`${translate('Enter your course price')} (${currencySymbol})`}
                    className={inputClass}
                    {...register('price', { required: true, min: 1 })}
                  />
                  <small className="text-xs text-rose-500 mt-1 inline-block">
                    {translate('Package discount rate')}{' '}
                    <span className="font-medium">{discountRate}</span>
                  </small>
                </div>

                <div>
                  <label className={labelClass}>
                    {translate('Package Expiry')} <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex gap-6">
                    <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                      <input type="radio" value="limited" {...register('expiry_type')} />
                      {translate('Limited')}
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                      <input type="radio" value="lifetime" {...register('expiry_type')} />
                      {translate('Lifetime')}
                    </label>
                  </div>
                </div>

                {expiryType === 'limited' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>{translate('Start date')}</label>
                      <input type="date" className={inputClass} {...register('start_date')} />
                    </div>
                    <div>
                      <label className={labelClass}>{translate('Expiry Date')}</label>
                      <input type="date" className={inputClass} {...register('expiry_date')} />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className={labelClass} htmlFor="team-thumbnail">{translate('Thumbnail')}</label>
              <input
                id="team-thumbnail"
                type="file"
                accept="image/*"
                onChange={onThumbChange}
                className={inputClass}
              />
              {thumbPreview && (
                <div className="mt-2">
                  <img
                    src={thumbPreview}
                    alt={translate('Thumbnail preview')}
                    className="w-32 h-20 object-cover rounded-lg border border-gray-200"
                  />
                </div>
              )}
            </div>

            <div>
              <label className={labelClass}>{translate('Features')}</label>
              <div className="space-y-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex gap-2">
                    <input
                      type="text"
                      placeholder={translate('Provide package features')}
                      className={inputClass}
                      {...register(`features.${index}`)}
                    />
                    {index === 0 ? (
                      <button
                        type="button"
                        onClick={() => append('')}
                        className="w-10 h-10 inline-flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                        title={translate('Add new')}
                      >
                        <i className="fi-rr-plus-small" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="w-10 h-10 inline-flex items-center justify-center rounded-lg border border-gray-200 text-rose-600 hover:bg-rose-50"
                        title={translate('Remove')}
                      >
                        <i className="fi-rr-minus-small" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-gray-100 gap-2">
          <button
            type="button"
            onClick={() => navigate('/admin/team-packages')}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            {translate('Cancel')}
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {isSubmitting ? translate('Saving...') : translate('Submit')}
          </button>
        </div>
      </form>
    </>
  );
}
