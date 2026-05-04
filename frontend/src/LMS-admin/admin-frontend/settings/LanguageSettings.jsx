/**
 * LanguageSettings - Multi-language management.
 *
 * ============================================================================
 * ORIGINAL BLADE: resources/views/admin/setting/language_setting.blade.php
 * ============================================================================
 *
 * Tabs: Language list, Add language, Import language.
 * List shows each language with direction (LTR/RTL), edit phrases link, delete.
 * Add form: name + direction. Import: upload JSON file.
 */

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import NoData from '@/components/common/NoData';
import ConfirmModal from '@/components/common/ConfirmModal';
import { useApi } from '@/hooks/useApi';
import { useSettings } from '@/contexts/SettingsContext';
import { API } from '@/config/routes';

const API_LANGUAGES = `${API.ADMIN_LANGUAGES || '/api/admin/languages'}`;

export default function LanguageSettings() {
  const { translate } = useSettings();
  const { get, post, del } = useApi();

  const [tab, setTab] = useState('list');
  const [languages, setLanguages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState({ open: false });

  // Add form
  const [newName, setNewName] = useState('');
  const [newDir, setNewDir] = useState('ltr');

  const fetchLanguages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await get(API_LANGUAGES);
      setLanguages(res.data || res || []);
    } catch {
      toast.error(translate('Failed to load languages'));
    } finally {
      setLoading(false);
    }
  }, [get, translate]);

  useEffect(() => {
    fetchLanguages();
  }, [fetchLanguages]);

  const addLanguage = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setSaving(true);
    try {
      await post(API_LANGUAGES, { name: newName, direction: newDir });
      toast.success(translate('Language added'));
      setNewName('');
      setNewDir('ltr');
      setTab('list');
      fetchLanguages();
    } catch (err) {
      toast.error(err?.response?.data?.message || translate('Failed to add'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await del(`${API_LANGUAGES}/${id}`);
      toast.success(translate('Language deleted'));
      fetchLanguages();
    } catch {
      toast.error(translate('Failed to delete'));
    }
    setConfirm({ open: false });
  };

  const importLanguage = async (e) => {
    e.preventDefault();
    const file = e.target.file?.files?.[0];
    if (!file) return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      await post(`${API_LANGUAGES}/import`, fd);
      toast.success(translate('Language imported'));
      setTab('list');
      fetchLanguages();
    } catch {
      toast.error(translate('Failed to import'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="bg-white border border-gray-100 rounded-lg">
        <div className="px-5 my-3 py-4">
          <h4 className="title text-base">
            <i className="fi-rr-settings-sliders mr-2" />
            {translate('Manage Language')}
          </h4>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-lg p-4">
        <div className="">
          <ul className="nav flex gap-2 border-b border-gray-200 mb-3">
            {['list', 'add', 'import'].map((t) => (
              <li key={t}>
                <button
                  className={`px-3 py-2 text-sm text-gray-600 hover:text-emerald-600 ${tab === t ? 'border-b-2 border-emerald-600 text-emerald-700 font-medium -mb-px' : ''}`}
                  type="button"
                  onClick={() => setTab(t)}
                >
                  {translate(
                    t === 'list' ? 'Language list' : t === 'add' ? 'Add Language' : 'Import Language'
                  )}
                </button>
              </li>
            ))}
          </ul>

          {/* Language list */}
          {tab === 'list' && (
            <>
              {loading ? (
                <LoadingSpinner />
              ) : languages.length === 0 ? (
                <NoData />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full mt-3">
                    <thead>
                      <tr>
                        <th>{translate('Language')}</th>
                        <th>{translate('Direction')}</th>
                        <th>{translate('Option')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {languages.map((lang) => (
                        <tr key={lang.id}>
                          <td>{lang.name}</td>
                          <td>
                            <span className="inline-block text-xs font-medium px-2 py-0.5 rounded bg-sky-500">{lang.direction?.toUpperCase() || 'LTR'}</span>
                          </td>
                          <td>
                            <button
                              className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors text-sm border border-red-500 text-red-500 hover:bg-red-50"
                              onClick={() =>
                                setConfirm({ open: true, onConfirm: () => handleDelete(lang.id) })
                              }
                            >
                              <i className="fi-rr-trash" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* Add language */}
          {tab === 'add' && (
            <form onSubmit={addLanguage}>
              <div className="flex flex-wrap">
                <div className="w-full md:w-1/2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{translate('Language name')}</label>
                  <input
                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required
                  />
                </div>
                <div className="w-full md:w-1/2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{translate('Direction')}</label>
                  <select
                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    value={newDir}
                    onChange={(e) => setNewDir(e.target.value)}
                  >
                    <option value="ltr">LTR</option>
                    <option value="rtl">RTL</option>
                  </select>
                </div>
              </div>
              <button className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-emerald-600 text-white hover:bg-emerald-700 mt-3" type="submit" disabled={saving}>
                {saving ? translate('Saving...') : translate('Add language')}
              </button>
            </form>
          )}

          {/* Import */}
          {tab === 'import' && (
            <form onSubmit={importLanguage}>
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{translate('JSON language file')}</label>
                <input className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" type="file" name="file" accept=".json" required />
              </div>
              <button className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-emerald-600 text-white hover:bg-emerald-700" type="submit" disabled={saving}>
                {saving ? translate('Importing...') : translate('Import')}
              </button>
            </form>
          )}
        </div>
      </div>

      <ConfirmModal isOpen={confirm.open} onClose={() => setConfirm({ open: false })} onConfirm={confirm.onConfirm} />
    </>
  );
}
