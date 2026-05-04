import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAdminPage } from '../../../components/layouts/portable-admin';

export default function AdminCourseApproval() {
  const { api, routes, translate, toast } = useAdminPage();
  const { id } = useParams();
  const navigate = useNavigate();

  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const resolveRoute = (route, params) => {
    if (!route) return '';
    if (typeof route === 'function') return route(...Object.values(params || {}));
    return String(route).replace(/:([a-z_][a-z0-9_]*)/gi, (_, k) => params?.[k] ?? '');
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = resolveRoute(routes.ADMIN_COURSE_APPROVAL, { id }) || `/api/admin/courses/${id}/approval`;
      await api.post(url, { subject, message });
      toast.success(translate('Approval email sent'));
      const editUrl = resolveRoute(routes.ADMIN_COURSE_EDIT, { id }) || `/admin/courses/${id}/edit`;
      navigate(editUrl);
    } catch {
      toast.error(translate('Failed to send'));
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500';
  const labelCls = 'block text-sm font-medium text-gray-700 mb-1.5';

  return (
    <div className="bg-white border border-gray-100 rounded-lg p-5">
      <h4 className="text-base font-semibold text-gray-900 mb-4">
        {translate('Send approval email')}
      </h4>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className={labelCls}>{translate('Subject')}</label>
          <input
            className={inputCls}
            type="text"
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>
        <div>
          <label className={labelCls}>{translate('Message')}</label>
          <textarea
            className={inputCls}
            rows="5"
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            {translate('Cancel')}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {saving ? translate('Sending...') : translate('Send approval email')}
          </button>
        </div>
      </form>
    </div>
  );
}
