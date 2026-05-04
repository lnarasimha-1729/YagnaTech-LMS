/**
 * AdminKnowledgeBase - CRUD for knowledge-base categories.
 *
 * ============================================================================
 * ORIGINAL BLADE:
 *   resources/views/admin/knowledge_base/index.blade.php
 *   resources/views/admin/knowledge_base/create.blade.php
 *   resources/views/admin/knowledge_base/edit.blade.php
 * ============================================================================
 *
 * Table of knowledge-base categories with article counts. Inline modal
 * for create/edit (title only). Dropdown: Articles link, Edit, Delete.
 */

import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import NoData from '@/components/common/NoData';
import Pagination from '@/components/common/Pagination';
import ConfirmModal from '@/components/common/ConfirmModal';
import { useApi } from '@/hooks/useApi';
import { useSettings } from '@/contexts/SettingsContext';

export default function AdminKnowledgeBase() {
  const { translate } = useSettings();
  const { get, post, del } = useApi();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null); // { id?, title }
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await get(`/api/admin/knowledge-base?page=${page}`);
      const data = res.data || res;
      setItems(data.data || data.items || data || []);
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

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const saveItem = async () => {
    if (!modal.title.trim()) {
      toast.error(translate('Title is required'));
      return;
    }
    setSaving(true);
    try {
      if (modal.id) {
        await post(`/api/admin/knowledge-base/${modal.id}`, { title: modal.title, _method: 'PUT' });
      } else {
        await post('/api/admin/knowledge-base', { title: modal.title });
      }
      toast.success(translate(modal.id ? 'Updated' : 'Created'));
      setModal(null);
      fetchItems();
    } catch {
      toast.error(translate('Failed to save'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await del(`/api/admin/knowledge-base/${id}`);
      toast.success(translate('Deleted'));
      fetchItems();
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
              {translate('Knowledge base')}
            </h4>
            <button
              className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors border border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center cg-10px"
              type="button"
              onClick={() => setModal({ title: '' })}
            >
              <span className="fi-rr-plus" />
              <span>{translate('Add Knowledge base')}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="ol-card p-20px">
        <div className="ol-card-body">
          {loading ? (
            <LoadingSpinner />
          ) : items.length === 0 ? (
            <NoData />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="eTable eTable-2 w-full">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>{translate('Title')}</th>
                      <th className="text-center">{translate('Total Articles')}</th>
                      <th className="text-center">{translate('Options')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, i) => (
                      <tr key={item.id}>
                        <td>{(pagination.current_page - 1) * 10 + i + 1}</td>
                        <td>{item.title}</td>
                        <td className="text-center">{item.articles_count ?? item.topics_count ?? 0}</td>
                        <td>
                          <div className="relative ol-icon-dropdown ol-icon-dropdown-transparent flex justify-center">
                            <button className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200" type="button" data-bs-toggle="dropdown">
                              <span className="fi-rr-menu-dots-vertical" />
                            </button>
                            <ul className="absolute mt-2 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-30">
                              <li>
                                <Link className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" to={`/admin/knowledge-base/${item.id}/articles`}>
                                  {translate('Articles')}
                                </Link>
                              </li>
                              <li>
                                <button
                                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                  type="button"
                                  onClick={() => setModal({ id: item.id, title: item.title })}
                                >
                                  {translate('Edit')}
                                </button>
                              </li>
                              <li>
                                <button
                                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                  type="button"
                                  onClick={() => setConfirm({ id: item.id })}
                                >
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

      {modal && (
        <div className="modal fade show block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={(e) => e.target === e.currentTarget && setModal(null)}>
          <div className="mx-auto flex items-center justify-center">
            <div className="bg-white rounded-2xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h5 className="text-base font-semibold text-gray-900">{translate(modal.id ? 'Edit Knowledge base' : 'Add Knowledge base')}</h5>
                <button type="button" className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100" onClick={() => setModal(null)} />
              </div>
              <div className="px-6 py-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5 block text-sm font-medium text-gray-700 mb-1.5">{translate('Title')}</label>
                <input
                  className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  type="text"
                  required
                  autoFocus
                  value={modal.title}
                  onChange={(e) => setModal({ ...modal, title: e.target.value })}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); saveItem(); } }}
                />
              </div>
              <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100">
                <button type="button" className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-gray-500 text-white hover:bg-gray-600" onClick={() => setModal(null)}>{translate('Cancel')}</button>
                <button type="button" className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-indigo-600 text-white hover:bg-indigo-700" onClick={saveItem} disabled={saving}>
                  {saving ? translate('Saving...') : translate('Submit')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirm && (
        <ConfirmModal message={translate('Delete this knowledge base?')} onConfirm={() => handleDelete(confirm.id)} onCancel={() => setConfirm(null)} />
      )}
    </>
  );
}
