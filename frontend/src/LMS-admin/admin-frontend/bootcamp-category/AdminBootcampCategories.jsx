/**
 * AdminBootcampCategories - Bootcamp category CRUD with inline add/edit modal.
 *
 * ============================================================================
 * ORIGINAL BLADE:
 *   resources/views/admin/bootcamp_category/index.blade.php
 *   resources/views/admin/bootcamp_category/create.blade.php
 *   resources/views/admin/bootcamp_category/edit.blade.php
 * ============================================================================
 */

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import NoData from '@/components/common/NoData';
import ConfirmModal from '@/components/common/ConfirmModal';
import Pagination from '@/components/common/Pagination';
import { useApi } from '@/hooks/useApi';
import { useSettings } from '@/contexts/SettingsContext';

export default function AdminBootcampCategories() {
  const { translate } = useSettings();
  const { get, post, del } = useApi();

  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null); // { id?, title }
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await get(`/api/admin/bootcamp-categories?page=${page}`);
      const data = res.data || res;
      setCategories(data.data || data.categories || []);
      setPagination({
        current_page: data.current_page || 1,
        last_page: data.last_page || 1,
        total: data.total || 0,
      });
    } catch {
      toast.error(translate('Failed to load categories'));
    } finally {
      setLoading(false);
    }
  }, [get, page, translate]);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const submit = async (e) => {
    e.preventDefault();
    if (!modal) return;
    setSaving(true);
    try {
      if (modal.id) {
        await post(`/api/admin/bootcamp-categories/${modal.id}`, { _method: 'PUT', title: modal.title });
        toast.success(translate('Category updated'));
      } else {
        await post('/api/admin/bootcamp-categories', { title: modal.title });
        toast.success(translate('Category added'));
      }
      setModal(null);
      fetchCategories();
    } catch {
      toast.error(translate('Failed to save'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await del(`/api/admin/bootcamp-categories/${id}`);
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
      <div className="ol-card radius-8px">
        <div className="ol-card-body py-12px px-20px my-3">
          <div className="flex items-center justify-between flex-md-nowrap flex-wrap gap-3">
            <h4 className="title text-base">
              <i className="fi-rr-settings-sliders mr-2" />
              {translate('Bootcamp Category')}
            </h4>
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors border border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center cg-10px"
              onClick={() => setModal({ title: '' })}
            >
              <span className="fi-rr-plus" />
              <span>{translate('Add new category')}</span>
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : categories.length === 0 ? (
        <div className="ol-card"><div className="ol-card-body"><NoData /></div></div>
      ) : (
        <>
          <div className="flex flex-wrap -mx-3 g-2 g-sm-3 row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 mb-3">
            {categories.map((c) => (
              <div key={c.id} className="col">
                <div className="ol-card card-hover">
                  <div className="ol-card-body px-20px flex justify-between py-3">
                    <div>
                      <p className="title card-title-hover mb-1">{c.title}</p>
                      <p className="sub-title text-xs mb-0">
                        {translate('Total bootcamps')} {c.bootcamps_count ?? 0}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors text-sm bg-gray-100 text-gray-700 hover:bg-gray-200"
                        onClick={() => setModal({ id: c.id, title: c.title })}
                      >
                        <span className="fi-rr-pencil" />
                      </button>
                      <button
                        type="button"
                        className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors text-sm bg-gray-100 text-gray-700 hover:bg-gray-200"
                        onClick={() => setConfirm({ id: c.id })}
                      >
                        <span className="fi-rr-trash" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center flex-wrap gap-2 mb-5">
            <p className="admin-tInfo mb-0">
              {translate('Showing')} {categories.length} {translate('of')} {pagination.total} {translate('data')}
            </p>
            {pagination.last_page > 1 && (
              <Pagination
                currentPage={pagination.current_page}
                lastPage={pagination.last_page}
                onPageChange={setPage}
              />
            )}
          </div>
        </>
      )}

      {modal && (
        <div
          className="modal fade show block"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={(e) => e.target === e.currentTarget && setModal(null)}
        >
          <div className="mx-auto flex items-center justify-center">
            <div className="bg-white rounded-2xl">
              <form onSubmit={submit}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                  <h5 className="text-base font-semibold text-gray-900">
                    {translate(modal.id ? 'Edit category' : 'Add new category')}
                  </h5>
                  <button type="button" className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100" onClick={() => setModal(null)} />
                </div>
                <div className="px-6 py-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 block text-sm font-medium text-gray-700 mb-1.5">{translate('Title')}</label>
                  <input
                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    type="text"
                    required
                    value={modal.title}
                    onChange={(e) => setModal({ ...modal, title: e.target.value })}
                  />
                </div>
                <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100">
                  <button type="button" className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-gray-500 text-white hover:bg-gray-600" onClick={() => setModal(null)}>
                    {translate('Cancel')}
                  </button>
                  <button type="submit" className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-indigo-600 text-white hover:bg-indigo-700" disabled={saving}>
                    {saving ? translate('Saving...') : translate(modal.id ? 'Save' : 'Add category')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {confirm && (
        <ConfirmModal
          message={translate('Delete this category?')}
          onConfirm={() => handleDelete(confirm.id)}
          onCancel={() => setConfirm(null)}
        />
      )}
    </>
  );
}
