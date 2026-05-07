/**
 * AdminNewsletterSend - Compose and send a newsletter to subscribers.
 *
 * ============================================================================
 * ORIGINAL BLADE: resources/views/admin/newsletter/send.blade.php
 * ============================================================================
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useApi } from '@/hooks/useApi';
import { useSettings } from '@/contexts/SettingsContext';

export default function AdminNewsletterSend() {
  const { translate } = useSettings();
  const { post } = useApi();
  const navigate = useNavigate();

  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sendTo, setSendTo] = useState('all');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await post('/api/admin/newsletter/send', {
        subject,
        body,
        send_to: sendTo,
      });
      toast.success(translate('Newsletter sent'));
      navigate('/admin/newsletter/subscribers');
    } catch {
      toast.error(translate('Failed to send newsletter'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="bg-white border border-gray-100 rounded-lg">
        <div className="px-5 my-3 py-4">
          <h4 className="title text-base mb-0">
            <i className="fi-rr-envelope mr-2" />
            {translate('Send Newsletter')}
          </h4>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-lg p-4">
        <div className="">
          <form onSubmit={submit}>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {translate('Subject')} <span className="text-red-600">*</span>
              </label>
              <input
                className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {translate('Body')} <span className="text-red-600">*</span>
              </label>
              <textarea
                className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                rows="10"
                required
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {translate('Send To')} <span className="text-red-600">*</span>
              </label>
              <select
                className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={sendTo}
                onChange={(e) => setSendTo(e.target.value)}
              >
                <option value="all">{translate('All Subscribers')}</option>
                <option value="registered">{translate('Registered Users Only')}</option>
                <option value="unregistered">{translate('Unregistered Only')}</option>
              </select>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-gray-500 text-white hover:bg-gray-600"
                onClick={() => navigate('/admin/newsletter/subscribers')}
              >
                {translate('Cancel')}
              </button>
              <button type="submit" className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-emerald-600 text-white hover:bg-emerald-700" disabled={saving}>
                {saving ? translate('Sending...') : translate('Send Newsletter')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
