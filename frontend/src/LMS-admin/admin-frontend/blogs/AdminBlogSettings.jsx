/**
 * AdminBlogSettings - Blog settings (instructor permission + homepage visibility).
 *
 * ============================================================================
 * ORIGINAL BLADE: resources/views/admin/blog/setting.blade.php
 * ============================================================================
 *
 * Two dropdowns: instructor blog permission and blog visibility on homepage.
 */

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useApi } from '@/hooks/useApi';
import { useSettings } from '@/contexts/SettingsContext';
import { API } from '@/config/routes';

export default function AdminBlogSettings() {
  const { translate } = useSettings();
  const { get, post } = useApi();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    (async () => {
      try {
        const res = await get(API.ADMIN_BLOG_SETTINGS);
        const data = res.data || res;
        reset({
          instructors_blog_permission: String(data.instructors_blog_permission ?? '0'),
          blog_visibility_on_the_home_page: String(data.blog_visibility_on_the_home_page ?? '1'),
        });
      } catch { /* use defaults */ }
      finally { setLoading(false); }
    })();
  }, [get, reset]);

  const onSubmit = async (values) => {
    setSaving(true);
    try {
      await post(API.ADMIN_BLOG_SETTINGS, values);
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
      <div className="ol-card radius-8px">
        <div className="ol-card-body px-20px my-3 py-4">
          <h4 className="title text-base">
            <i className="fi-rr-settings-sliders mr-2" />
            <span>{translate('Blog settings')}</span>
          </h4>
        </div>
      </div>

      <div className="flex flex-wrap -mx-3">
        <div className="w-full md:w-1/2">
          <div className="ol-card p-4">
            <div className="ol-card-body">
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="fpb-7 mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 block text-sm font-medium text-gray-700 mb-1.5">
                    {translate('Instructor permission')}
                  </label>
                  <select className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" {...register('instructors_blog_permission')}>
                    <option value="1">{translate('Provide access')}</option>
                    <option value="0">{translate('Decline access')}</option>
                  </select>
                </div>

                <div className="fpb-7 mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 block text-sm font-medium text-gray-700 mb-1.5">
                    {translate('Visibility on homepage')}
                  </label>
                  <select className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" {...register('blog_visibility_on_the_home_page')}>
                    <option value="1">{translate('Visible')}</option>
                    <option value="0">{translate('Hidden')}</option>
                  </select>
                </div>

                <div className="fpb-7 mb-3">
                  <button className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-indigo-600 text-white hover:bg-indigo-700" type="submit" disabled={saving}>
                    {saving ? translate('Saving...') : translate('Save changes')}
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
