/**
 * CategoryForm — 1:1 port of admin/category/create.blade.php + edit.blade.php
 * Shared form rendered inside a modal. Multipart POST/PUT via FormData.
 */

import { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useApi } from '@/hooks/useApi';
import { API } from '@/config/routes';
import { useSettings } from '@/contexts/SettingsContext';

const inputClass =
  'w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent';
const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5';

export default function CategoryForm({ category, parentId, parentCategories, onSuccess }) {
  const { translate } = useSettings();
  const { post, put, loading } = useApi();
  const isEdit = Boolean(category);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    defaultValues: { title: '', icon: '', keywords: '', description: '', parent_id: '' },
  });

  useEffect(() => {
    if (isEdit && category) {
      reset({
        title: category.title || '',
        icon: category.icon || '',
        keywords: category.keywords || '',
        description: category.description || '',
        parent_id: category.parent_id ?? '',
      });
    } else {
      setValue('parent_id', parentId ?? '');
    }
  }, [category, parentId, isEdit, reset, setValue]);

  const onSubmit = async (data) => {
    const fd = new FormData();
    fd.append('title', data.title);
    fd.append('icon', data.icon);
    fd.append('keywords', data.keywords || '');
    fd.append('description', data.description || '');
    if (isEdit) {
      fd.append('parent_id', data.parent_id ?? '');
    } else if (parentId) {
      fd.append('parent_id', parentId);
    }
    if (data.thumbnail?.[0]) fd.append('thumbnail', data.thumbnail[0]);
    if (data.category_logo?.[0]) fd.append('category_logo', data.category_logo[0]);

    try {
      if (isEdit) {
        await put(API.ADMIN_CATEGORY(category.id), fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success(translate('Category updated successfully'));
      } else {
        await post(API.ADMIN_CATEGORIES, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success(translate('Category added successfully'));
      }
      onSuccess?.();
    } catch (err) {
      toast.error(err.response?.data?.message || translate('Something went wrong'));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} encType="multipart/form-data" className="space-y-4">
      {isEdit && (
        <div>
          <label className={labelClass}>{translate('Parent category')}</label>
          <select className={inputClass} {...register('parent_id')}>
            <option value="">{translate('- Mark it as parent -')}</option>
            {parentCategories?.map((p) => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className={labelClass} htmlFor="category_name">
          {translate('Category Name')}
        </label>
        <input
          id="category_name"
          type="text"
          className={`${inputClass} ${errors.title ? 'border-rose-400' : ''}`}
          placeholder={translate('Enter your category name')}
          {...register('title', { required: true })}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="icon-picker">{translate('Pick Your Icon')}</label>
        <input
          id="icon-picker"
          type="text"
          className={`${inputClass} ${errors.icon ? 'border-rose-400' : ''}`}
          placeholder={translate('Pick your category icon (e.g. fi-rr-book)')}
          autoComplete="off"
          {...register('icon', { required: true })}
        />
        <small className="text-xs text-gray-500">
          {translate('Enter a FlatIcon class name, e.g. fi-rr-book')}
        </small>
      </div>

      <div>
        <label className={labelClass} htmlFor="keywords">
          {translate('Keywords')}{' '}
          <small className="text-gray-500 font-normal">({translate('optional')})</small>
        </label>
        <input
          id="keywords"
          type="text"
          className={inputClass}
          placeholder={translate('Enter your Keywords')}
          {...register('keywords')}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="description">
          {translate('Category Description')}{' '}
          <small className="text-gray-500 font-normal">({translate('optional')})</small>
        </label>
        <textarea
          id="description"
          rows={4}
          className={inputClass}
          placeholder={translate('Enter your description')}
          {...register('description')}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="thumbnail">
          {translate('Thumbnail')}{' '}
          <small className="text-gray-500 font-normal">({translate('optional')})</small>
        </label>
        <input
          id="thumbnail"
          type="file"
          accept="image/*"
          className={inputClass}
          {...register('thumbnail')}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="category_logo">
          {translate('Category logo')}{' '}
          <small className="text-gray-500 font-normal">({translate('optional')})</small>
        </label>
        <input
          id="category_logo"
          type="file"
          accept="image/*"
          className={inputClass}
          {...register('category_logo')}
        />
      </div>

      <div>
        <button
          type="submit"
          className="inline-flex items-center px-5 py-2 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? translate('Saving...') : translate('Submit')}
        </button>
      </div>
    </form>
  );
}

CategoryForm.propTypes = {
  category: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    title: PropTypes.string,
    icon: PropTypes.string,
    keywords: PropTypes.string,
    description: PropTypes.string,
    parent_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }),
  parentId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  parentCategories: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      title: PropTypes.string.isRequired,
    })
  ),
  onSuccess: PropTypes.func,
};

CategoryForm.defaultProps = {
  category: null,
  parentId: null,
  parentCategories: [],
  onSuccess: undefined,
};
