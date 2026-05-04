/**
 * EmailTemplateSettings - Email notification templates management.
 *
 * ============================================================================
 * ORIGINAL BLADE:
 *   resources/views/admin/setting/email_template.blade.php
 *   resources/views/admin/setting/edit_email_template.blade.php
 * ============================================================================
 *
 * Table listing email notification types with subjects and templates.
 * Inline editing of subjects and templates per user type.
 */

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useApi } from '@/hooks/useApi';
import { useSettings } from '@/contexts/SettingsContext';

const ENDPOINT = '/api/admin/settings/email-templates';

export default function EmailTemplateSettings() {
  const { translate } = useSettings();
  const { get, post } = useApi();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [editing, setEditing] = useState(null);
  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await get(ENDPOINT);
      setTemplates(res.data || res || []);
    } catch {
      toast.error(translate('Failed to load email templates'));
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (template) => {
    setEditing(template);
    const formData = {};
    if (template.subject && typeof template.subject === 'object') {
      Object.entries(template.subject).forEach(([userType, val]) => {
        formData[`subject_${userType}`] = val;
      });
    }
    if (template.template && typeof template.template === 'object') {
      Object.entries(template.template).forEach(([userType, val]) => {
        formData[`template_${userType}`] = val;
      });
    }
    reset(formData);
  };

  const onSubmit = async (values) => {
    setSaving(true);
    try {
      const subject = {};
      const templateData = {};
      Object.entries(values).forEach(([key, val]) => {
        if (key.startsWith('subject_')) subject[key.replace('subject_', '')] = val;
        if (key.startsWith('template_')) templateData[key.replace('template_', '')] = val;
      });
      await post(`${ENDPOINT}/${editing.id}`, { subject, template: templateData });
      toast.success(translate('Email template saved'));
      setEditing(null);
      fetchTemplates();
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
            {translate('Email Templates')}
          </h4>
        </div>
      </div>

      {editing ? (
        <div className="bg-white border border-gray-100 rounded-lg p-4">
          <div className="">
            <div className="flex justify-between items-center mb-3">
              <h5>{editing.setting_title}</h5>
              <button className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors text-sm bg-gray-500 text-white hover:bg-gray-600" onClick={() => setEditing(null)}>
                {translate('Back to list')}
              </button>
            </div>
            <p className="text-gray-500 mb-3">{editing.setting_sub_title}</p>
            <form onSubmit={handleSubmit(onSubmit)}>
              {editing.subject && typeof editing.subject === 'object' &&
                Object.keys(editing.subject).map((userType) => (
                  <div className="fpb-7 mb-3" key={`subject_${userType}`}>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      {translate('Email subject')} <small>({translate(`To ${userType}`)})</small>
                    </label>
                    <input
                      className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      type="text"
                      {...register(`subject_${userType}`)}
                    />
                  </div>
                ))
              }
              {editing.template && typeof editing.template === 'object' &&
                Object.keys(editing.template).map((userType) => (
                  <div className="fpb-7 mb-3" key={`template_${userType}`}>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      {translate('Email template')} <small>({translate(`To ${userType}`)})</small>
                    </label>
                    <textarea
                      className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      rows="6"
                      {...register(`template_${userType}`)}
                    />
                  </div>
                ))
              }
              <button className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-emerald-600 text-white hover:bg-emerald-700" type="submit" disabled={saving}>
                {saving ? translate('Saving...') : translate('Save changes')}
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-lg">
          <div className=" p-3">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>{translate('Email type')}</th>
                    <th>{translate('Email subject')}</th>
                    <th>{translate('Action')}</th>
                  </tr>
                </thead>
                <tbody>
                  {templates.map((t, i) => (
                    <tr key={t.id}>
                      <td>{i + 1}</td>
                      <td>
                        <strong>{t.setting_title}</strong>
                        <br />
                        <small className="text-gray-500">{t.setting_sub_title}</small>
                      </td>
                      <td>
                        {t.subject && typeof t.subject === 'object' &&
                          Object.entries(t.subject).map(([userType, subject]) => (
                            <p key={userType} className="mb-1">
                              <small className="text-gray-500">{translate(`To ${userType}`)}:</small> {subject}
                            </p>
                          ))
                        }
                      </td>
                      <td>
                        <button className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors text-sm bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => startEdit(t)}>
                          <i className="fi-rr-edit mr-1" />
                          {translate('Edit')}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {templates.length === 0 && (
                    <tr>
                      <td colSpan="4" className="text-center text-gray-500 py-4">
                        {translate('No email templates found')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
