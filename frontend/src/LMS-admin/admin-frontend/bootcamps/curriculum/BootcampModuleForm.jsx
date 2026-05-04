/**
 * BootcampModuleForm — port of admin/bootcamp_module/create.blade.php + edit.blade.php.
 * Shared modal body for add/edit of a bootcamp module (title, restriction, validity range).
 */

import { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useApi } from '@/hooks/useApi';
import { useSettings } from '@/contexts/SettingsContext';
import { API } from '@/config/routes';

const inputClass =
  'w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent';
const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5';

function toYmd(ts) {
  if (!ts) return '';
  const n = Number(ts);
  const d = Number.isFinite(n) && n > 1e9 ? new Date(n * 1000) : new Date(ts);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

export default function BootcampModuleForm({ bootcampId, module, onSuccess, onCancel }) {
  const { translate } = useSettings();
  const { post, put } = useApi();
  const isEdit = Boolean(module);

  const today = new Date().toISOString().slice(0, 10);

  const { register, handleSubmit, watch, reset, formState: { isSubmitting } } = useForm({
    defaultValues: {
      title: '',
      restriction: '0',
      publish_date: today,
      expiry_date: today,
    },
  });

  useEffect(() => {
    if (isEdit && module) {
      reset({
        title: module.title || '',
        restriction: String(module.restriction ?? '0'),
        publish_date: toYmd(module.publish_date) || today,
        expiry_date: toYmd(module.expiry_date) || today,
      });
    }
  }, [isEdit, module, reset, today]);

  const restriction = watch('restriction');

  const onSubmit = async (values) => {
    const payload = {
      bootcamp_id: bootcampId,
      title: values.title,
      restriction: Number(values.restriction),
      publish_date: values.publish_date,
      expiry_date: values.expiry_date,
    };
    try {
      if (isEdit) {
        await put(API.ADMIN_BOOTCAMP_MODULE(module.id), payload);
        toast.success(translate('Module has been updated successfully.'));
      } else {
        await post(API.ADMIN_BOOTCAMP_MODULES(bootcampId), payload);
        toast.success(translate('Module has been added successfully.'));
      }
      onSuccess?.();
    } catch (err) {
      toast.error(err.response?.data?.message || translate('Failed to save module'));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className={labelClass} htmlFor="module-title">{translate('Title')}</label>
        <input
          id="module-title"
          type="text"
          className={inputClass}
          {...register('title', { required: true })}
        />
      </div>

      <div>
        <label className={labelClass}>{translate('Module Restriction')}</label>
        <select className={inputClass} {...register('restriction')}>
          <option value="0">{translate('Select an option')}</option>
          <option value="1">{translate('Until start date, keep this module locked.')}</option>
          <option value="2">{translate('Keep this module open only within the selected date range.')}</option>
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>
            {translate('Start date')}
            {restriction !== '0' && <span className="text-rose-500 ml-1">*</span>}
          </label>
          <input
            type="date"
            className={inputClass}
            {...register('publish_date', { required: restriction !== '0' })}
          />
        </div>
        <div>
          <label className={labelClass}>
            {translate('End date')}
            {restriction === '2' && <span className="text-rose-500 ml-1">*</span>}
          </label>
          <input
            type="date"
            className={inputClass}
            disabled={restriction !== '2'}
            {...register('expiry_date', { required: restriction === '2' })}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          {translate('Cancel')}
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-5 py-2 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {isSubmitting
            ? translate('Saving...')
            : isEdit ? translate('Update module') : translate('Add module')}
        </button>
      </div>
    </form>
  );
}

BootcampModuleForm.propTypes = {
  bootcampId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  module: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    title: PropTypes.string,
    restriction: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    publish_date: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    expiry_date: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }),
  onSuccess: PropTypes.func,
  onCancel: PropTypes.func,
};

BootcampModuleForm.defaultProps = {
  module: null,
  onSuccess: undefined,
  onCancel: undefined,
};
