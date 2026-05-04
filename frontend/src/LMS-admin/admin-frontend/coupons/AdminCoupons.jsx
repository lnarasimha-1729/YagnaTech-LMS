/**
 * AdminCoupons — 1:1 port of admin/coupon/{index,create,edit}.blade.php
 * Paginated list + modal form for create/edit, inline status toggle + delete.
 */

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import NoData from '@/components/common/NoData';
import Pagination from '@/components/common/Pagination';
import ConfirmModal from '@/components/common/ConfirmModal';
import Modal from '@/components/common/Modal';
import { useApi } from '@/hooks/useApi';
import { useSettings } from '@/contexts/SettingsContext';
import { API } from '@/config/routes';

const inputClass =
  'w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent';
const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5';

export default function AdminCoupons() {
  const { translate } = useSettings();
  const { get, post, put, del } = useApi();
  const [searchParams, setSearchParams] = useSearchParams();

  const [coupons, setCoupons] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ open: false });
  const [menuOpen, setMenuOpen] = useState(null);
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');

  const { register, handleSubmit, reset } = useForm();

  const page = searchParams.get('page') || '1';
  const search = searchParams.get('search') || '';

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page };
      if (search) params.search = search;
      const res = await get(API.ADMIN_COUPONS, { params });
      setCoupons(res.data || []);
      setMeta(res.meta || null);
    } catch {
      toast.error(translate('Failed to load coupons'));
    } finally {
      setLoading(false);
    }
  }, [get, page, search, translate]);

  useEffect(() => { fetchCoupons(); }, [fetchCoupons]);

  const onSearch = (e) => {
    e.preventDefault();
    const next = new URLSearchParams(searchParams);
    if (searchInput) next.set('search', searchInput); else next.delete('search');
    next.delete('page');
    setSearchParams(next);
  };

  const openCreate = () => {
    setEditing(null);
    reset({ code: '', discount: '', expiry: '', status: '1' });
    setModalOpen(true);
  };

  const openEdit = (coupon) => {
    setEditing(coupon);
    reset({
      code: coupon.code,
      discount: coupon.discount,
      expiry: coupon.expiry ? String(coupon.expiry).slice(0, 10) : '',
      status: String(coupon.status),
    });
    setModalOpen(true);
    setMenuOpen(null);
  };

  const onSubmit = async (values) => {
    setSaving(true);
    try {
      if (editing) {
        await put(API.ADMIN_COUPON(editing.id), values);
        toast.success(translate('Coupon has been updated successfully.'));
      } else {
        await post(API.ADMIN_COUPONS, values);
        toast.success(translate('Coupon has been created successfully.'));
      }
      setModalOpen(false);
      fetchCoupons();
    } catch (err) {
      toast.error(err.response?.data?.message || translate('Failed to save'));
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (id) => {
    setMenuOpen(null);
    try {
      await post(API.ADMIN_COUPON_STATUS(id));
      toast.success(translate('Status has been updated'));
      fetchCoupons();
    } catch {
      toast.error(translate('Failed to update status'));
    }
  };

  const handleDelete = async (id) => {
    try {
      await del(API.ADMIN_COUPON(id));
      toast.success(translate('Coupon has been deleted successfully.'));
      fetchCoupons();
    } catch {
      toast.error(translate('Failed to delete'));
    }
    setConfirmModal({ open: false });
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Page header */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h4 className="flex items-center gap-2 text-base font-semibold text-gray-900">
            <i className="fi-rr-settings-sliders text-emerald-600" />
            <span>{translate('Coupon')}</span>
          </h4>
          <button
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
            onClick={openCreate}
          >
            <i className="fi-rr-plus" />
            <span>{translate('Add Coupon')}</span>
          </button>
        </div>
      </div>

      {/* Card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div />
          <form className="flex gap-2 w-full sm:w-auto" onSubmit={onSearch}>
            <input
              type="text"
              className={`${inputClass} sm:w-64`}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={translate('Search coupon')}
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {translate('Search')}
            </button>
          </form>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : coupons.length === 0 ? (
          <NoData message={translate('No coupons found')} />
        ) : (
          <>
            <p className="text-xs text-gray-500 mb-3">
              {`${translate('Showing')} ${coupons.length} ${translate('of')} ${meta?.total ?? coupons.length} ${translate('data')}`}
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-medium text-gray-500 uppercase bg-gray-50 border-y border-gray-100">
                    <th scope="col" className="px-4 py-3">#</th>
                    <th scope="col" className="px-4 py-3">{translate('Coupon code')}</th>
                    <th scope="col" className="px-4 py-3">{translate('Discount')}</th>
                    <th scope="col" className="px-4 py-3">{translate('Expiry')}</th>
                    <th scope="col" className="px-4 py-3">{translate('Status')}</th>
                    <th scope="col" className="px-4 py-3 text-right">{translate('Options')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {coupons.map((c, idx) => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <th scope="row" className="px-4 py-3 font-medium text-gray-900">
                        {(meta?.from || 1) + idx}
                      </th>
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-900">{c.code}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{c.discount} {translate('%')}</td>
                      <td className="px-4 py-3 text-gray-700">
                        {c.expiry ? new Date(c.expiry).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block text-xs font-medium px-2 py-1 rounded text-white ${c.status ? 'bg-emerald-600' : 'bg-rose-500'}`}
                        >
                          {translate(c.status ? 'Active' : 'Inactive')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="relative inline-block">
                          <button
                            type="button"
                            className="w-8 h-8 rounded-lg hover:bg-gray-100 text-gray-600 inline-flex items-center justify-center"
                            onClick={() => setMenuOpen(menuOpen === c.id ? null : c.id)}
                          >
                            <i className="fi-rr-menu-dots-vertical" />
                          </button>
                          {menuOpen === c.id && (
                            <ul className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-20 text-left">
                              <li>
                                <button
                                  type="button"
                                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                  onClick={() => toggleStatus(c.id)}
                                >
                                  {translate(c.status ? 'Deactivate' : 'Activate')}
                                </button>
                              </li>
                              <li>
                                <button
                                  type="button"
                                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                  onClick={() => openEdit(c)}
                                >
                                  {translate('Edit')}
                                </button>
                              </li>
                              <li>
                                <button
                                  type="button"
                                  className="w-full text-left px-3 py-2 text-sm text-rose-600 hover:bg-rose-50"
                                  onClick={() => {
                                    setMenuOpen(null);
                                    setConfirmModal({ open: true, onConfirm: () => handleDelete(c.id) });
                                  }}
                                >
                                  {translate('Delete')}
                                </button>
                              </li>
                            </ul>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4">
              <Pagination
                meta={meta}
                onPageChange={(p) => {
                  const next = new URLSearchParams(searchParams);
                  next.set('page', String(p));
                  setSearchParams(next);
                }}
              />
            </div>
          </>
        )}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? translate('Edit Coupon') : translate('Add Coupon')}
        size="md"
        footer={null}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className={labelClass} htmlFor="code">{translate('Code')}</label>
            <input
              id="code"
              type="text"
              className={inputClass}
              placeholder={translate('Enter coupon code')}
              {...register('code', { required: true })}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="discount">{translate('Discount (%)')}</label>
            <input
              id="discount"
              type="number"
              min="0"
              max="100"
              className={inputClass}
              placeholder={translate('Enter coupon discount')}
              {...register('discount', { required: true })}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="expiry">{translate('Expiry')}</label>
            <input
              id="expiry"
              type="date"
              className={inputClass}
              {...register('expiry', { required: true })}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="status">{translate('Status')}</label>
            <select id="status" className={inputClass} {...register('status', { required: true })}>
              <option value="">{translate('Choose status ...')}</option>
              <option value="1">{translate('Active')}</option>
              <option value="0">{translate('Inactive')}</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
              onClick={() => setModalOpen(false)}
            >
              {translate('Cancel')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {saving
                ? translate('Saving...')
                : editing ? translate('Update coupon') : translate('Add coupon')}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={confirmModal.open}
        onClose={() => setConfirmModal({ open: false })}
        onConfirm={confirmModal.onConfirm}
      />
    </div>
  );
}
