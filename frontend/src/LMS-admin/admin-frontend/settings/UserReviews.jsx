/**
 * UserReviews - Admin CRUD for user reviews (list + inline create/edit modal).
 *
 * ============================================================================
 * ORIGINAL BLADES:
 *   resources/views/admin/setting/user_review_list.blade.php
 *   resources/views/admin/setting/user_review_create.blade.php
 *   resources/views/admin/setting/user_review_edit.blade.php
 * ============================================================================
 */

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import NoData from '@/components/common/NoData';
import ConfirmModal from '@/components/common/ConfirmModal';
import { useApi } from '@/hooks/useApi';
import { useSettings } from '@/contexts/SettingsContext';

export default function UserReviews() {
  const { translate } = useSettings();
  const { get, post, del } = useApi();

  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [users, setUsers] = useState([]);
  const [confirm, setConfirm] = useState(null);

  // Modal state
  const [modal, setModal] = useState(null); // null | { mode: 'create' } | { mode: 'edit', review }
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ user_id: '', rating: '', review: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await get('/api/admin/reviews');
      const data = res.data || res;
      setReviews(data.reviews || data || []);
      setUsers(data.users || []);
    } catch {
      toast.error(translate('Failed to load reviews'));
    } finally {
      setLoading(false);
    }
  }, [get, translate]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setForm({ user_id: '', rating: '', review: '' });
    setModal({ mode: 'create' });
  };

  const openEdit = (review) => {
    setForm({
      user_id: String(review.user_id),
      rating: String(review.rating),
      review: review.review || '',
    });
    setModal({ mode: 'edit', review });
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal.mode === 'create') {
        await post('/api/admin/reviews', form);
        toast.success(translate('Review added'));
      } else {
        await post(`/api/admin/reviews/${modal.review.id}`, { ...form, _method: 'PUT' });
        toast.success(translate('Review updated'));
      }
      setModal(null);
      load();
    } catch {
      toast.error(translate('Failed to save'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await del(`/api/admin/reviews/${id}`);
      toast.success(translate('Deleted'));
      load();
    } catch {
      toast.error(translate('Failed to delete'));
    } finally {
      setConfirm(null);
    }
  };

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <div className="bg-white border border-gray-100 rounded-lg">
        <div className="py-3 px-5 my-3">
          <div className="flex items-center justify-between  flex-wrap gap-3">
            <h4 className="title text-base">
              <i className="fi-rr-settings-sliders mr-2" />
              {translate('Review')}
            </h4>
            <button
              className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors border border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center cg-10px"
              type="button"
              onClick={openCreate}
            >
              <span className="fi-rr-plus" />
              <span>{translate('Add new Review')}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap">
        <div className="w-full">
          <div className="bg-white border border-gray-100 rounded-lg">
            <div className=" p-3">
              {reviews.length === 0 ? (
                <NoData />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>{translate('Name')}</th>
                        <th>{translate('Rating')}</th>
                        <th>{translate('Review')}</th>
                        <th>{translate('Options')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reviews.map((r, idx) => (
                        <tr key={r.id}>
                          <td>{idx + 1}</td>
                          <td>
                            <div className="dAdmin_info_name" style={{ minWidth: 150 }}>
                              <p>{r.user_name || r.user?.name || '—'}</p>
                            </div>
                          </td>
                          <td>{r.rating}</td>
                          <td>{r.review}</td>
                          <td>
                            <div className="relative ol-icon-dropdown ol-icon-dropdown-transparent">
                              <button
                                className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200"
                                type="button"
                                data-bs-toggle="dropdown"
                              >
                                <span className="fi-rr-menu-dots-vertical" />
                              </button>
                              <ul className="absolute mt-2 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-30">
                                <li>
                                  <button className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" type="button" onClick={() => openEdit(r)}>
                                    {translate('Edit')}
                                  </button>
                                </li>
                                <li>
                                  <button
                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                    type="button"
                                    onClick={() => setConfirm({ id: r.id })}
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
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {modal && (
        <div className="modal fade show block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="mx-auto flex items-center justify-center modal-lg">
            <div className="bg-white rounded-2xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h5 className="text-base font-semibold text-gray-900">
                  {modal.mode === 'create' ? translate('Add new Review') : translate('Edit Review')}
                </h5>
                <button className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100" type="button" onClick={() => setModal(null)} />
              </div>
              <form onSubmit={submit}>
                <div className="px-6 py-4">
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{translate('Select User')}</label>
                    <select
                      className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                      value={form.user_id}
                      onChange={(e) => update('user_id', e.target.value)}
                    >
                      <option value="">{translate('Select an user')}</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{translate('Rating')}</label>
                    <select
                      className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                      value={form.rating}
                      onChange={(e) => update('rating', e.target.value)}
                    >
                      <option value="">{translate('Select a Rating')}</option>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{translate('Review')}</label>
                    <textarea
                      className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      rows="4"
                      value={form.review}
                      onChange={(e) => update('review', e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100">
                  <button className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors border border-gray-300 text-gray-700 hover:bg-gray-50" type="button" onClick={() => setModal(null)}>
                    {translate('Cancel')}
                  </button>
                  <button className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-emerald-600 text-white hover:bg-emerald-700" type="submit" disabled={saving}>
                    {saving
                      ? translate('Saving...')
                      : modal.mode === 'create'
                        ? translate('Add Review')
                        : translate('Update Review')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {confirm && (
        <ConfirmModal
          message={translate('Delete this review?')}
          onConfirm={() => handleDelete(confirm.id)}
          onCancel={() => setConfirm(null)}
        />
      )}
    </>
  );
}
