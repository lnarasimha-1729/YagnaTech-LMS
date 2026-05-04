/**
 * NotificationSettings - Per-event, per-user-type notification toggles.
 *
 * ============================================================================
 * ORIGINAL BLADES:
 *   resources/views/admin/setting/notification.blade.php
 *   resources/views/admin/setting/notification_setting.blade.php
 * ============================================================================
 *
 * Each notification event has system + email toggles for each user type
 * (admin, instructor, student). Toggles call the API immediately on change.
 */

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useApi } from '@/hooks/useApi';
import { useSettings } from '@/contexts/SettingsContext';

export default function NotificationSettings() {
  const { translate } = useSettings();
  const { get, post } = useApi();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await get('/api/admin/settings/notifications');
      const data = res.data || res;
      setSettings(Array.isArray(data) ? data : data.settings || []);
    } catch {
      toast.error(translate('Failed to load'));
    } finally {
      setLoading(false);
    }
  }, [get, translate]);

  useEffect(() => { load(); }, [load]);

  const toggleNotification = async (settingId, userType, notificationType) => {
    // Optimistic update
    setSettings((prev) =>
      prev.map((s) => {
        if (s.id !== settingId) return s;
        const key = `${notificationType}_notification`;
        const current = s[key] || {};
        return {
          ...s,
          [key]: { ...current, [userType]: !current[userType] },
        };
      }),
    );

    try {
      await post('/api/admin/settings/notifications/toggle', {
        id: settingId,
        user_type: userType,
        notification_type: notificationType,
      });
      toast.success(translate('Updated'));
    } catch {
      toast.error(translate('Failed to update'));
      load(); // Revert on failure
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <div className="bg-white border border-gray-100 rounded-lg">
        <div className="px-5 my-3 py-4">
          <h4 className="title text-base">
            <i className="fi-rr-settings-sliders mr-2" />
            {translate('Notification Settings')}
          </h4>
        </div>
      </div>

      <div className="flex flex-wrap">
        <div className="w-full">
          <div className="bg-white border border-gray-100 rounded-lg p-4">
            <div className="">
              <h4 className="title mb-3 mt-2">
                {translate('Configure your notification settings')}
              </h4>

              {settings.map((setting) => {
                const userTypes = setting.user_types || ['admin', 'instructor', 'student'];
                const systemNotif = setting.system_notification || {};
                const emailNotif = setting.email_notification || {};
                const isEditable = setting.is_editable !== 0;

                return (
                  <div key={setting.id} className="flex flex-wrap mb-4 border-b border-gray-200 pb-3">
                    <div className="w-full mb-2">
                      <label className="m-0 p-0 font-bold">
                        {translate(setting.setting_title)}
                        {!isEditable && (
                          <small className="text-yellow-600 ml-2">
                            <b>({translate('Not editable')})</b>
                          </small>
                        )}
                      </label>
                      <p className="text-gray-500 mb-1">
                        <small>{translate(setting.setting_sub_title || '')}</small>
                      </p>
                    </div>

                    {userTypes.map((type) => (
                      <div key={type} className="col-auto">
                        <small className="block text-sm font-medium text-gray-700 mb-1.5 capitalize">
                          {translate('Configure for')} {type}
                        </small>

                        <div className="flex items-center mb-2">
                          <input
                            className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                            type="checkbox"
                            id={`${setting.id}-${type}-system`}
                            checked={!!systemNotif[type]}
                            disabled={!isEditable}
                            onChange={() => toggleNotification(setting.id, type, 'system')}
                          />
                          <label
                            className="text-sm text-gray-700 ml-2"
                            htmlFor={`${setting.id}-${type}-system`}
                          >
                            {translate('System notification')}
                          </label>
                        </div>

                        <div className="flex items-center mb-2">
                          <input
                            className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                            type="checkbox"
                            id={`${setting.id}-${type}-email`}
                            checked={!!emailNotif[type]}
                            disabled={!isEditable}
                            onChange={() => toggleNotification(setting.id, type, 'email')}
                          />
                          <label
                            className="text-sm text-gray-700 ml-2"
                            htmlFor={`${setting.id}-${type}-email`}
                          >
                            {translate('Email notification')}
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}

              {settings.length === 0 && (
                <p className="text-gray-500">{translate('No notification settings found')}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
