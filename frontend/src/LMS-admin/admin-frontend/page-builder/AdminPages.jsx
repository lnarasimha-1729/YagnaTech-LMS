/**
 * AdminPages — port of admin/page_builder/page_list.blade.php (+ page_create / page_edit partials).
 * Lists builder pages with activation toggle, edit name modal, preview/layout-edit links.
 */

import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import NoData from '@/components/common/NoData';
import Modal from '@/components/common/Modal';
import ConfirmModal from '@/components/common/ConfirmModal';
import { useApi } from '@/hooks/useApi';
import { useSettings } from '@/contexts/SettingsContext';
import { API } from '@/config/routes';

export default function AdminPages() {
  const { translate } = useSettings();
  const { get, post, del } = useApi();

  const [loading, setLoading] = useState(true);
  const [pages, setPages] = useState([]);
  const [formModal, setFormModal] = useState(null);
  const [formName, setFormName] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmState, setConfirmState] = useState({ open: false });

  const fetchPages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await get(API.ADMIN_PAGES_API);
      const data = res.data || res;
      setPages(data.pages || data || []);
    } catch {
      toast.error(translate('Failed to load pages'));
    } finally {
      setLoading(false);
    }
  }, [get, translate]);

  useEffect(() => { fetchPages(); }, [fetchPages]);

  const openCreate = () => { setFormModal({}); setFormName(''); };
  const openEdit = (p) => { setFormModal({ id: p.id }); setFormName(p.name); };
  const closeForm = () => { setFormModal(null); setFormName(''); };

  const submit = async (e) => {
    e.preventDefault();
    const name = formName.trim();
    if (!name) return;
    setSaving(true);
    try {
      if (formModal.id) {
        const fd = new FormData();
        fd.append('name', name);
        fd.append('_method', 'PUT');
        await post(API.ADMIN_PAGE(formModal.id), fd);
        toast.success(translate('Page updated'));
      } else {
        await post(API.ADMIN_PAGES_API, { name });
        toast.success(translate('Page created'));
      }
      closeForm();
      fetchPages();
    } catch {
      toast.error(translate('Failed to save'));
    } finally {
      setSaving(false);
    }
  };

  const activate = async (id) => {
    try {
      await post(API.ADMIN_PAGE_STATUS(id), {});
      toast.success(translate('Page activated'));
      fetchPages();
    } catch {
      toast.error(translate('Failed to activate'));
    }
  };

  const handleDelete = async (id) => {
    try {
      await del(API.ADMIN_PAGE(id));
      toast.success(translate('Page deleted'));
      fetchPages();
    } catch {
      toast.error(translate('Failed to delete'));
    } finally {
      setConfirmState({ open: false });
    }
  };

  return (
    <>
      <div className="bg-white border border-gray-100 rounded-lg mb-4">
        <div className="flex items-center justify-between px-5 py-3 flex-wrap gap-3">
          <h4 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <i className="fi-rr-settings-sliders" />
            {translate('Home Page Builder')}
          </h4>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <span className="fi-rr-plus" />
            <span>{translate('Create Page')}</span>
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-lg p-4">
        {loading ? (
          <LoadingSpinner />
        ) : pages.length === 0 ? (
          <NoData />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-gray-500 border-b border-gray-200">
                  <th className="px-3 py-2">#</th>
                  <th className="px-3 py-2">{translate('Page Name')}</th>
                  <th className="px-3 py-2">{translate('Status')}</th>
                  <th className="px-3 py-2">{translate('Action')}</th>
                </tr>
              </thead>
              <tbody>
                {pages.map((p, i) => {
                  const active = p.status === 1 || p.status === true;
                  return (
                    <tr key={p.id} className="border-b border-gray-100 align-middle">
                      <td className="px-3 py-3">{i + 1}</td>
                      <td className="px-3 py-3 text-gray-900">{p.name}</td>
                      <td className="px-3 py-3">
                        <label className="inline-flex items-center gap-2 cursor-pointer">
                          <span className="relative inline-block w-10 h-6">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={active}
                              disabled={active}
                              onChange={() => activate(p.id)}
                            />
                            <span className="absolute inset-0 rounded-full bg-gray-300 peer-checked:bg-emerald-500 transition-colors" />
                            <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
                          </span>
                          <span className="text-xs text-gray-600">
                            {active ? translate('Active') : translate('Inactive')}
                          </span>
                        </label>
                      </td>
                      <td className="px-3 py-3">
                        {!p.is_permanent && (
                          <div className="flex flex-wrap gap-2">
                            <Link
                              to={`/admin/pages/${p.id}/preview`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
                            >
                              {translate('Preview')}
                            </Link>
                            <Link
                              to={`/admin/pages/${p.id}/layout`}
                              className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
                            >
                              {translate('Edit Layout')}
                            </Link>
                            <button
                              type="button"
                              onClick={() => openEdit(p)}
                              className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
                            >
                              {translate('Edit')}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmState({
                                open: true,
                                message: translate('Delete this page?'),
                                onConfirm: () => handleDelete(p.id),
                              })}
                              className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium border border-rose-200 text-rose-700 hover:bg-rose-50"
                            >
                              {translate('Delete')}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        isOpen={Boolean(formModal)}
        onClose={closeForm}
        title={translate(formModal?.id ? 'Edit Page' : 'Create Page')}
        size="md"
        footer={null}
      >
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {translate('Page name')}
            </label>
            <input
              type="text"
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder={translate('Enter your page name')}
              className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={closeForm}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              {translate('Cancel')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {saving ? translate('Saving...') : translate('Submit')}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={confirmState.open}
        onClose={() => setConfirmState({ open: false })}
        onConfirm={confirmState.onConfirm || (() => {})}
        message={confirmState.message}
      />
    </>
  );
}
