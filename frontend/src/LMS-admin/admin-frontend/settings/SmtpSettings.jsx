/**
 * SmtpSettings - SMTP mail transport configuration.
 *
 * ============================================================================
 * ORIGINAL BLADE: resources/views/admin/setting/smtp_settings.blade.php
 * ============================================================================
 */

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useApi } from '@/hooks/useApi';
import { useSettings } from '@/contexts/SettingsContext';

export default function SmtpSettings() {
  const { translate } = useSettings();
  const { get, post } = useApi();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    protocol: 'smtp',
    smtp_crypto: 'tls',
    smtp_host: '',
    smtp_port: '',
    smtp_from_email: '',
    smtp_user: '',
    smtp_pass: '',
  });
  const [showPass, setShowPass] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await get('/api/admin/settings/smtp');
      const data = res.data || res;
      setForm((f) => ({ ...f, ...data }));
    } catch {
      toast.error(translate('Failed to load SMTP settings'));
    } finally {
      setLoading(false);
    }
  }, [get, translate]);

  useEffect(() => { load(); }, [load]);

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await post('/api/admin/settings/smtp', { ...form, _method: 'PUT' });
      toast.success(translate('SMTP settings saved'));
    } catch {
      toast.error(translate('Failed to save'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <form onSubmit={submit}>
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {translate('Protocol')} <small>(smtp or ssmtp or mail)</small>
          <span className="text-red-600 ml-1">*</span>
        </label>
        <input
          className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          type="text"
          required
          value={form.protocol}
          onChange={(e) => update('protocol', e.target.value)}
        />
      </div>

      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {translate('Smtp crypto')} <small>(ssl or tls)</small>
        </label>
        <input
          className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          type="text"
          value={form.smtp_crypto}
          onChange={(e) => update('smtp_crypto', e.target.value)}
        />
      </div>

      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {translate('Smtp host')} <span className="text-red-600 ml-1">*</span>
        </label>
        <input
          className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          type="text"
          required
          value={form.smtp_host}
          onChange={(e) => update('smtp_host', e.target.value)}
        />
      </div>

      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {translate('Smtp port')} <span className="text-red-600 ml-1">*</span>
        </label>
        <input
          className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          type="text"
          required
          value={form.smtp_port}
          onChange={(e) => update('smtp_port', e.target.value)}
        />
      </div>

      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {translate('Smtp from email')} <span className="text-red-600 ml-1">*</span>
        </label>
        <input
          className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          type="email"
          required
          value={form.smtp_from_email}
          onChange={(e) => update('smtp_from_email', e.target.value)}
        />
      </div>

      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {translate('Smtp username')} <span className="text-red-600 ml-1">*</span>
        </label>
        <input
          className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          type="text"
          required
          value={form.smtp_user}
          onChange={(e) => update('smtp_user', e.target.value)}
        />
      </div>

      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {translate('Smtp password')} <span className="text-red-600 ml-1">*</span>
        </label>
        <div className="flex">
          <input
            className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            type={showPass ? 'text' : 'password'}
            required
            value={form.smtp_pass}
            onChange={(e) => update('smtp_pass', e.target.value)}
          />
          <button
            className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200"
            type="button"
            onClick={() => setShowPass((s) => !s)}
          >
            <i className={showPass ? 'fi-rr-eye-crossed' : 'fi-rr-eye'} />
          </button>
        </div>
      </div>

      <button className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-emerald-600 text-white hover:bg-emerald-700" type="submit" disabled={saving}>
        {saving ? translate('Saving...') : translate('Save')}
      </button>
    </form>
  );
}
