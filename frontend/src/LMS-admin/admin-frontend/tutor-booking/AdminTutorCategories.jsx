/**
 * AdminTutorCategories - Tutor booking category CRUD.
 *
 * ============================================================================
 * ORIGINAL BLADE:
 *   resources/views/admin/tutor_booking/categories.blade.php
 *   resources/views/admin/tutor_booking/category_add.blade.php
 *   resources/views/admin/tutor_booking/category_edit.blade.php
 * ============================================================================
 */

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import NoData from '@/components/common/NoData';
import Pagination from '@/components/common/Pagination';
import ConfirmModal from '@/components/common/ConfirmModal';
import Modal from '@/components/common/Modal';
import { useApi } from '@/hooks/useApi';
import { useSettings } from '@/contexts/SettingsContext';

export default function AdminTutorCategories() {
  const { translate } = useSettings();
  const { get, post, del } = useApi();

  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await get(`/api/admin/tutor-booking/categories?page=${page}`);
      const data = res.data || res;
      setCategories(data.data || data.categories || []);
      setPagination({
        current_page: data.current_page || 1,
        last_page: data.last_page || 1,
        total: data.total || 0,
      });
    } catch {
      toast.error(translate('Failed to load'));
    } finally {
      setLoading(false);
    }
  }, [get, page, translate]);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const save = async () => {
    if (!modal.name.trim()) {
      toast.error(translate('Name is required'));
      return;
    }
    setSaving(true);
    try {
      if (modal.id) {
        await post(`/api/admin/tutor-booking/categories/${modal.id}`, { name: modal.name, _method: 'PUT' });
      } else {
        await post('/api/admin/tutor-booking/categories', { name: modal.name });
      }
      toast.success(translate(modal.id ? 'Updated' : 'Created'));
      setModal(null);
      fetchCategories();
    } catch {
      toast.error(translate('Failed to save'));
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (id) => {
    try {
      await post(`/api/admin/tutor-booking/categories/${id}/toggle-status`);
      fetchCategories();
    } catch {
      toast.error(translate('Failed to update'));
    }
  };

  const handleDelete = async (id) => {
    try {
      await del(`/api/admin/tutor-booking/categories/${id}`);
      toast.success(translate('Deleted'));
      fetchCategories();
    } catch {
      toast.error(translate('Failed to delete'));
    } finally {
      setConfirm(null);
    }
  };

  return (
    <>
      <div className="bg-white border border-gray-100 rounded-lg">
        <div className="py-3 px-5 my-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h4 className="title text-base">
              <i className="fi-rr-settings-sliders mr-2" />
              {translate('Tutor categories')} <span className="text-gray-500">({pagination.total})</span>
            </h4>
            <button className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors border border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center cg-10px" type="button" onClick={() => setModal({ name: '' })}>
              <span className="fi-rr-plus" />
              <span>{translate('Add new category')}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap">
        <div className="w-full md:w-7/12">
          <div className="bg-white border border-gray-100 rounded-lg p-4">
            <div className="">
              {loading ? (
                <LoadingSpinner />
              ) : categories.length === 0 ? (
                <NoData />
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>{translate('Name')}</th>
                          <th className="text-center">{translate('Status')}</th>
                          <th className="text-center">{translate('Action')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categories.map((cat, i) => (
                          <tr key={cat.id}>
                            <td>{(pagination.current_page - 1) * 10 + i + 1}</td>
                            <td>{cat.name}</td>
                            <td className="text-center">
                              {cat.status === 1 || cat.status === true ? translate('Active') : translate('Deactive')}
                            </td>
                            <td className="text-center">
                              <div className="relative ol-icon-dropdown">
                                <button className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200" type="button" data-bs-toggle="dropdown">
                                  <span className="fi-rr-menu-dots-vertical" />
                                </button>
                                <ul className="absolute mt-2 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-30">
                                  <li>
                                    <button className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" type="button" onClick={() => setModal({ id: cat.id, name: cat.name })}>
                                      {translate('Edit')}
                                    </button>
                                  </li>
                                  <li>
                                    <button className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" type="button" onClick={() => toggleStatus(cat.id)}>
                                      {cat.status === 1 || cat.status === true ? translate('Deactive') : translate('Active')}
                                    </button>
                                  </li>
                                  <li>
                                    <button className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 text-red-600" type="button" onClick={() => setConfirm({ id: cat.id })}>
                                      {translate('Delete')}
                                    </button>
                                  </li>
                                </ul>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {pagination.last_page > 1 && (
                    <Pagination currentPage={pagination.current_page} lastPage={pagination.last_page} onPageChange={setPage} />
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={!!modal}
        onClose={() => setModal(null)}
        title={translate(modal?.id ? 'Edit category' : 'Add new category')}
        footer={(
          <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100">
            <button type="button" className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-gray-500 text-white hover:bg-gray-600" onClick={() => setModal(null)}>{translate('Cancel')}</button>
            <button type="button" className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-emerald-600 text-white hover:bg-emerald-700" onClick={save} disabled={saving}>
              {saving ? translate('Saving...') : translate('Submit')}
            </button>
          </div>
        )}
      >
        {modal && (
          <>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{translate('Name')}</label>
            <input
              className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              type="text"
              autoFocus
              value={modal.name}
              onChange={(e) => setModal({ ...modal, name: e.target.value })}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); save(); } }}
            />
          </>
        )}
      </Modal>

      <ConfirmModal
        isOpen={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => handleDelete(confirm?.id)}
        message={translate('Delete this category?')}
      />
    </>
  );
}
