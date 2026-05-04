/**
 * AdminPermissions - Assign feature-level permissions to an admin user.
 *
 * ============================================================================
 * ORIGINAL BLADE: resources/views/admin/admin/permission.blade.php
 * ============================================================================
 */

import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useApi } from '@/hooks/useApi';
import { useSettings } from '@/contexts/SettingsContext';

const PERMISSION_ROUTES = [
  { route: 'admin.dashboard', label: 'Dashboard' },
  { route: 'admin.categories', label: 'Category' },
  { route: 'admin.courses', label: 'Course' },
  { route: 'admin.bootcamps', label: 'Bootcamp' },
  { route: 'admin.student.enroll', label: 'Enrollment' },
  { route: 'admin.enroll.history', label: 'Enroll History' },
  { route: 'admin.revenue', label: 'Admin Revenue' },
  { route: 'admin.instructor.revenue', label: 'Instructor Revenue' },
  { route: 'admin.purchase.history', label: 'Purchase history' },
  { route: 'admin.instructor.index', label: 'Instructor' },
  { route: 'admin.admins.index', label: 'Admin' },
  { route: 'admin.student.index', label: 'Student' },
  { route: 'admin.message', label: 'Message' },
  { route: 'admin.newsletter', label: 'Newsletter' },
  { route: 'admin.subscribed_user', label: 'Newsletter Subscriber' },
  { route: 'admin.contacts', label: 'Contact User' },
  { route: 'admin.offline.payments', label: 'Offline Payment' },
  { route: 'admin.coupons', label: 'Coupon' },
  { route: 'admin.blogs', label: 'Blog' },
  { route: 'admin.pending.blog', label: 'Pending Blog List' },
  { route: 'admin.blog.category', label: 'Blog Category' },
  { route: 'admin.blog.settings', label: 'Blog Settings' },
  { route: 'admin.system.settings', label: 'System Settings' },
  { route: 'admin.website.settings', label: 'Website Settings' },
  { route: 'admin.payment.settings', label: 'Payment Settings' },
  { route: 'admin.manage.language', label: 'Language Settings' },
  { route: 'admin.live.class.settings', label: 'Live Class Settings' },
  { route: 'admin.certificate.settings', label: 'Certificate' },
  { route: 'admin.open.ai.settings', label: 'Open AI Settings' },
  { route: 'admin.seo.settings', label: 'SEO Settings' },
  { route: 'admin.about', label: 'About' },
];

export default function AdminPermissions() {
  const { id } = useParams();
  const { translate } = useSettings();
  const { get, post } = useApi();
  const [loading, setLoading] = useState(true);
  const [admin, setAdmin] = useState(null);
  const [permissions, setPermissions] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await get(`/api/admin/admins/${id}/permissions`);
      const data = res.data || res;
      setAdmin(data.admin || data.user || null);
      setPermissions(data.permissions || []);
    } catch {
      toast.error(translate('Failed to load permissions'));
    } finally {
      setLoading(false);
    }
  }, [get, id, translate]);

  useEffect(() => { load(); }, [load]);

  const togglePermission = async (route) => {
    try {
      await post(`/api/admin/admins/${id}/permissions`, { permission: route });
      setPermissions((prev) =>
        prev.includes(route) ? prev.filter((p) => p !== route) : [...prev, route],
      );
      toast.success(translate('Permission updated'));
    } catch {
      toast.error(translate('Failed to update permission'));
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
              {translate('Admin Permissions')}
            </h4>
            <Link
              className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors border border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center cg-10px"
              to="/admin/admins"
            >
              <span className="fi-rr-arrow-alt-left" />
              <span>{translate('Back')}</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap -mx-3">
        <div className="col-xl-8">
          <div className="ol-card p-4">
            <div className="ol-card-body">
              <div className="w-1/2 pt-3">
                <p className="column-title">
                  {translate('Assign permission for')}: {admin?.name || ''}
                </p>
              </div>
              <div className="pb-3">
                <small>
                  <strong>{translate('Note')}</strong>:{' '}
                  {translate('You can toggle the switch for enabling or disabling a feature to access')}
                </small>
              </div>
              <div className="overflow-x-auto">
                <table className="eTable w-full">
                  <thead>
                    <tr>
                      <th>{translate('Feature')}</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {PERMISSION_ROUTES.map(({ route, label }) => (
                      <tr key={route}>
                        <td>{translate(label)}</td>
                        <td>
                          <div className="flex items-center form-switch">
                            <input
                              className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                              type="checkbox"
                              id={`perm-${route}`}
                              checked={permissions.includes(route)}
                              onChange={() => togglePermission(route)}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
