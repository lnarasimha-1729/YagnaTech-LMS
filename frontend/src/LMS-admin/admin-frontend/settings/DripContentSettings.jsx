/**
 * DripContentSettings - Drip content / lesson-completion rules.
 *
 * ============================================================================
 * ORIGINAL BLADE: resources/views/admin/setting/drip_content_setting.blade.php
 * ============================================================================
 *
 * Fields: lesson_completion_role (percentage|duration), minimum_percentage,
 * minimum_duration, locked_lesson_message.
 */

import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useApi } from '@/hooks/useApi';
import { useSettings } from '@/contexts/SettingsContext';

const ENDPOINT = '/api/admin/settings/drip-content';

export default function DripContentSettings() {
  const { translate } = useSettings();
  const { get, post } = useApi();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset, control } = useForm();

  const completionRole = useWatch({ control, name: 'lesson_completion_role', defaultValue: 'percentage' });

  useEffect(() => {
    (async () => {
      try {
        const res = await get(ENDPOINT);
        reset(res.data || res || {});
      } catch { /* defaults */ }
      finally { setLoading(false); }
    })();
  }, [get, reset]);

  const onSubmit = async (values) => {
    setSaving(true);
    try {
      await post(ENDPOINT, values);
      toast.success(translate('Settings saved'));
    } catch {
      toast.error(translate('Failed to save'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <div className="bg-white border border-gray-100 rounded-lg">
        <div className="px-5 my-3 py-4">
          <h4 className="title text-base">
            <i className="fi-rr-settings-sliders mr-2" />
            {translate('Drip Content Settings')}
          </h4>
        </div>
      </div>

      <div className="flex flex-wrap">
        <div className="w-full lg:w-7/12">
          <div className="bg-white border border-gray-100 rounded-lg p-4">
            <div className="">
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="fpb-7 mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {translate('Lesson completion role')} <span className="text-red-600">*</span>
                  </label>
                  <br />
                  <div className="flex gap-4">
                    <div>
                      <input
                        className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                        type="radio"
                        id="video_percentage_wise"
                        value="percentage"
                        {...register('lesson_completion_role')}
                      />
                      <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1" htmlFor="video_percentage_wise">
                        {translate('Video percentage wise')}
                      </label>
                    </div>
                    <div>
                      <input
                        className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                        type="radio"
                        id="video_duration_wise"
                        value="duration"
                        {...register('lesson_completion_role')}
                      />
                      <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1" htmlFor="video_duration_wise">
                        {translate('Video duration wise')}
                      </label>
                    </div>
                  </div>
                </div>

                {completionRole === 'duration' && (
                  <div className="fpb-7 mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="minimum_duration">
                      {translate('Minimum duration to watch')} <span className="text-red-600">*</span>
                    </label>
                    <input
                      id="minimum_duration"
                      className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      type="text"
                      placeholder="HH:MM:SS"
                      {...register('minimum_duration')}
                    />
                  </div>
                )}

                {completionRole === 'percentage' && (
                  <div className="fpb-7 mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="minimum_percentage">
                      {translate('Minimum percentage to watch')} <span className="text-red-600">*</span>
                    </label>
                    <div className="flex">
                      <input
                        id="minimum_percentage"
                        className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        type="number"
                        min="1"
                        max="100"
                        {...register('minimum_percentage')}
                      />
                      <span className="input-group-text">%</span>
                    </div>
                  </div>
                )}

                <div className="fpb-7 mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="locked_lesson_message">
                    {translate('Message for locked lesson')}
                  </label>
                  <textarea
                    id="locked_lesson_message"
                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    rows="5"
                    {...register('locked_lesson_message')}
                  />
                </div>

                <button className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-emerald-600 text-white hover:bg-emerald-700" type="submit" disabled={saving}>
                  {saving ? translate('Saving...') : translate('Save changes')}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-5/12">
          <div className="p-4 rounded-lg mb-4 bg-sky-50 text-sky-700 border border-sky-100" role="alert">
            <h5 className="alert-heading">{translate('Attention')}!</h5>
            <p className="mb-0">
              {translate('The auto checkmark is only applicable for video lessons')}.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
