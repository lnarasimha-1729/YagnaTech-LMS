/**
 * MotivationalSettings - Manage motivational speech entries (title/designation/description/image).
 *
 * ============================================================================
 * ORIGINAL BLADE: resources/views/admin/setting/motivational.blade.php
 * ============================================================================
 */

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useApi } from '@/hooks/useApi';
import { useSettings } from '@/contexts/SettingsContext';

const emptyEntry = () => ({ title: '', designation: '', description: '', image: '', image_file: null });

export default function MotivationalSettings() {
  const { translate } = useSettings();
  const { get, post } = useApi();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [entries, setEntries] = useState([emptyEntry()]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await get('/api/admin/settings/motivational');
      const data = res.data || res;
      const list = Array.isArray(data) ? data : data.speeches || data.motivational_speech || [];
      setEntries(list.length > 0 ? list.map((s) => ({ ...emptyEntry(), ...s })) : [emptyEntry()]);
    } catch {
      toast.error(translate('Failed to load'));
    } finally {
      setLoading(false);
    }
  }, [get, translate]);

  useEffect(() => { load(); }, [load]);

  const update = (idx, key, value) => {
    setEntries((es) => es.map((e, i) => (i === idx ? { ...e, [key]: value } : e)));
  };

  const addEntry = () => setEntries((es) => [...es, emptyEntry()]);

  const removeEntry = (idx) => {
    setEntries((es) => es.filter((_, i) => i !== idx));
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('type', 'motivational_speech');
      entries.forEach((entry, i) => {
        fd.append(`titles[${i}]`, entry.title);
        fd.append(`designation[${i}]`, entry.designation);
        fd.append(`descriptions[${i}]`, entry.description);
        fd.append(`previous_images[${i}]`, entry.image || '');
        if (entry.image_file) {
          fd.append(`images[${i}]`, entry.image_file);
        }
      });
      await post('/api/admin/settings/motivational', fd);
      toast.success(translate('Saved'));
      load();
    } catch {
      toast.error(translate('Failed to save'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <h4 className="title mb-3 mt-4">{translate('Motivational Speech')}</h4>
      <form onSubmit={submit}>
        <div className="flex flex-wrap">
          <div className="w-full md:w-8/12">
            {entries.map((entry, idx) => (
              <div key={idx} className={`flex${idx > 0 ? 'border-top mt-2 pt-2' : 'mt-2'}`}>
                <div className="flex-grow mb-3 px-2">
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{translate('Title')}</label>
                    <input
                      className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      type="text"
                      placeholder={translate('Title')}
                      value={entry.title}
                      onChange={(e) => update(idx, 'title', e.target.value)}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{translate('Designation')}</label>
                    <input
                      className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      type="text"
                      placeholder={translate('Designation')}
                      value={entry.designation}
                      onChange={(e) => update(idx, 'designation', e.target.value)}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{translate('Description')}</label>
                    <textarea
                      className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder={translate('Description')}
                      value={entry.description}
                      onChange={(e) => update(idx, 'description', e.target.value)}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{translate('Image')}</label>
                    <input
                      className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      type="file"
                      accept="image/*"
                      onChange={(e) => update(idx, 'image_file', e.target.files[0] || null)}
                    />
                    {entry.image && !entry.image_file && (
                      <small className="text-gray-500">{translate('Current')}: {entry.image}</small>
                    )}
                  </div>
                </div>
                <div className="pt-4">
                  {idx === 0 ? (
                    <button
                      className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200 ol-icon-btn mt-2"
                      type="button"
                      title={translate('Add new')}
                      onClick={addEntry}
                    >
                      <i className="fi-rr-plus-small" />
                    </button>
                  ) : (
                    <button
                      className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200 ol-icon-btn mt-2"
                      type="button"
                      title={translate('Remove')}
                      onClick={() => removeEntry(idx)}
                    >
                      <i className="fi-rr-minus-small" />
                    </button>
                  )}
                </div>
              </div>
            ))}
            <div className="mb-2 px-2">
              <button className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-emerald-600 text-white hover:bg-emerald-700" type="submit" disabled={saving}>
                {saving ? translate('Saving...') : translate('Save changes')}
              </button>
            </div>
          </div>
        </div>
      </form>
    </>
  );
}
