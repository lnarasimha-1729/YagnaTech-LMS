/**
 * BootcampLiveClassForm — port of admin/bootcamp_live_class/create.blade.php + edit.blade.php.
 * Modal body for add/edit of a live class (title, date/time, module, status, description).
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

function unixToDate(ts) {
  if (!ts) return '';
  const d = new Date(Number(ts) * 1000);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

function unixToTime(ts) {
  if (!ts) return '';
  const d = new Date(Number(ts) * 1000);
  if (Number.isNaN(d.getTime())) return '';
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export default function BootcampLiveClassForm({ modules, liveClass, defaultModuleId, onSuccess, onCancel }) {
  const { translate } = useSettings();
  const { post, put } = useApi();
  const isEdit = Boolean(liveClass);

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm({
    defaultValues: {
      title: '',
      date: '',
      start_time: '',
      end_time: '',
      module_id: defaultModuleId || '',
      status: 'upcoming',
      description: '',
    },
  });

  useEffect(() => {
    if (isEdit && liveClass) {
      reset({
        title: liveClass.title || '',
        date: unixToDate(liveClass.start_time),
        start_time: unixToTime(liveClass.start_time),
        end_time: unixToTime(liveClass.end_time),
        module_id: liveClass.module_id || '',
        status: liveClass.status || 'upcoming',
        description: liveClass.description || '',
      });
    }
  }, [isEdit, liveClass, reset]);

  const onSubmit = async (values) => {
    const payload = {
      title: values.title,
      date: values.date,
      start_time: values.start_time,
      end_time: values.end_time,
      module_id: values.module_id,
      status: values.status,
      description: values.description,
    };
    try {
      if (isEdit) {
        await put(API.ADMIN_BOOTCAMP_LIVE_CLASS(liveClass.id), payload);
        toast.success(translate('Class has been updated successfully.'));
      } else {
        await post(API.ADMIN_BOOTCAMP_LIVE_CLASSES(values.module_id), payload);
        toast.success(translate('Class has been added successfully.'));
      }
      onSuccess?.();
    } catch (err) {
      toast.error(err.response?.data?.message || translate('Failed to save class'));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className={labelClass} htmlFor="class-title">{translate('Title')}</label>
        <input id="class-title" type="text" className={inputClass} {...register('title', { required: true })} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className={labelClass}>{translate('Date')}</label>
          <input type="date" className={inputClass} {...register('date', { required: true })} />
        </div>
        <div>
          <label className={labelClass}>{translate('Start time')}</label>
          <input type="time" className={inputClass} {...register('start_time', { required: true })} />
        </div>
        <div>
          <label className={labelClass}>{translate('End time')}</label>
          <input type="time" className={inputClass} {...register('end_time', { required: true })} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>{translate('Module')}</label>
          <select className={inputClass} {...register('module_id', { required: true })}>
            <option value="">{translate('Select an option')}</option>
            {modules?.map((m) => (
              <option key={m.id} value={m.id}>{m.title}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>{translate('Status')}</label>
          <select className={inputClass} {...register('status', { required: true })}>
            <option value="upcoming">{translate('Upcoming')}</option>
            <option value="live">{translate('Live')}</option>
            <option value="completed">{translate('Completed')}</option>
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass}>{translate('Description')}</label>
        <textarea rows={5} className={inputClass} {...register('description')} />
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
            : isEdit ? translate('Update class') : translate('Add class')}
        </button>
      </div>
    </form>
  );
}

BootcampLiveClassForm.propTypes = {
  modules: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      title: PropTypes.string.isRequired,
    })
  ).isRequired,
  liveClass: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    title: PropTypes.string,
    start_time: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    end_time: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    module_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    status: PropTypes.string,
    description: PropTypes.string,
  }),
  defaultModuleId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onSuccess: PropTypes.func,
  onCancel: PropTypes.func,
};

BootcampLiveClassForm.defaultProps = {
  liveClass: null,
  defaultModuleId: '',
  onSuccess: undefined,
  onCancel: undefined,
};
