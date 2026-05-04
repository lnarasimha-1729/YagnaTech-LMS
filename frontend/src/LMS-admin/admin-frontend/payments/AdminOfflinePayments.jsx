/**
 * AdminOfflinePayments — port of admin/offline_payments/index.blade.php.
 * Paginated table of offline payments with status filter and per-row actions
 * (download receipt, accept, decline, delete).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import NoData from '@/components/common/NoData';
import Pagination from '@/components/common/Pagination';
import ConfirmModal from '@/components/common/ConfirmModal';
import { useApi } from '@/hooks/useApi';
import { useSettings } from '@/contexts/SettingsContext';
import { API } from '@/config/routes';

const STATUS_META = {
  0: { label: 'Pending', className: 'bg-amber-100 text-amber-800' },
  1: { label: 'Accepted', className: 'bg-emerald-100 text-emerald-800' },
  2: { label: 'Suspended', className: 'bg-rose-100 text-rose-800' },
};

export default function AdminOfflinePayments() {
  const { translate, formatCurrency } = useSettings();
  const { get, post, del } = useApi();
  const [searchParams, setSearchParams] = useSearchParams();

  const [payments, setPayments] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [confirm, setConfirm] = useState({ open: false });
  const menuRef = useRef(null);

  const page = searchParams.get('page') || '1';
  const status = searchParams.get('status') || 'all';

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page };
      if (status && status !== 'all') params.status = status;
      const res = await get(API.ADMIN_OFFLINE_PAYMENTS, { params });
      setPayments(res.data || []);
      setMeta(res.meta || null);
    } catch {
      toast.error(translate('Failed to load payments'));
    } finally {
      setLoading(false);
    }
  }, [get, page, status, translate]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpenMenuId(null);
    };
    if (openMenuId != null) document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [openMenuId]);

  const setStatusFilter = (s) => {
    const next = new URLSearchParams(searchParams);
    if (s && s !== 'all') next.set('status', s);
    else next.delete('status');
    next.delete('page');
    setSearchParams(next);
  };

  const clearFilters = () => setSearchParams(new URLSearchParams());

  const doAccept = async (id) => {
    setOpenMenuId(null);
    try {
      await post(API.ADMIN_OFFLINE_PAYMENT_ACCEPT(id));
      toast.success(translate('Payment accepted'));
      fetchPayments();
    } catch {
      toast.error(translate('Failed to accept'));
    }
  };

  const doDecline = async (id) => {
    try {
      await post(API.ADMIN_OFFLINE_PAYMENT_DECLINE(id));
      toast.success(translate('Payment declined'));
      fetchPayments();
    } catch {
      toast.error(translate('Failed to decline'));
    } finally {
      setConfirm({ open: false });
    }
  };

  const doDelete = async (id) => {
    try {
      await del(API.ADMIN_OFFLINE_PAYMENT(id));
      toast.success(translate('Payment deleted'));
      fetchPayments();
    } catch {
      toast.error(translate('Failed to delete'));
    } finally {
      setConfirm({ open: false });
    }
  };

  return (
    <>
      <div className="bg-white border border-gray-100 rounded-lg mb-4">
        <div className="px-5 py-3">
          <h4 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <i className="fi-rr-settings-sliders" />
            <span>{translate('Offline payments')}</span>
          </h4>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-lg p-4">
        <div className="flex flex-wrap gap-3 items-center mb-4">
          <label className="text-sm font-medium text-gray-700">{translate('Status')}:</label>
          <select
            className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            value={status}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">{translate('All')}</option>
            <option value="pending">{translate('Pending')}</option>
            <option value="accepted">{translate('Accepted')}</option>
            <option value="suspended">{translate('Suspended')}</option>
          </select>
          {status !== 'all' && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-sm text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1"
              title={translate('Clear')}
            >
              <i className="fi-rr-cross-circle" />
              <span>{translate('Clear')}</span>
            </button>
          )}
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : payments.length === 0 ? (
          <NoData />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase text-gray-500 border-b border-gray-200">
                    <th className="px-3 py-2">#</th>
                    <th className="px-3 py-2">{translate('User')}</th>
                    <th className="px-3 py-2">{translate('Items')}</th>
                    <th className="px-3 py-2">{translate('Type')}</th>
                    <th className="px-3 py-2">{translate('Total')}</th>
                    <th className="px-3 py-2">{translate('Issue date')}</th>
                    <th className="px-3 py-2">{translate('Payment info')}</th>
                    <th className="px-3 py-2">{translate('Status')}</th>
                    <th className="px-3 py-2">{translate('Options')}</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p, idx) => {
                    const st = STATUS_META[p.status] ?? STATUS_META[0];
                    const isOpen = openMenuId === p.id;
                    return (
                      <tr key={p.id} className="border-b border-gray-100 align-top">
                        <td className="px-3 py-3">{(meta?.from || 1) + idx}</td>
                        <td className="px-3 py-3 min-w-[200px]">
                          <p className="font-medium text-gray-900">{p.user?.name}</p>
                          <p className="text-xs text-gray-500">{p.user?.email}</p>
                          {p.user?.phone && (
                            <p className="text-xs text-gray-500">
                              {translate('Phone')}: {p.user.phone}
                            </p>
                          )}
                        </td>
                        <td className="px-3 py-3 min-w-[200px]">
                          {(p.item_details || []).map((it) => (
                            <p className="text-xs text-gray-600" key={it.id}>{it.title}</p>
                          ))}
                        </td>
                        <td className="px-3 py-3">
                          <span className="inline-block text-xs font-medium px-2 py-0.5 rounded bg-sky-100 text-sky-800 capitalize">
                            {p.item_type || '-'}
                          </span>
                        </td>
                        <td className="px-3 py-3">{formatCurrency(p.total_amount)}</td>
                        <td className="px-3 py-3">
                          {new Date(p.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-3 py-3">
                          <a
                            href={API.ADMIN_OFFLINE_PAYMENT_DOC(p.id)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700"
                          >
                            <i className="fi-rr-cloud-download" />
                            {translate('Download')}
                          </a>
                        </td>
                        <td className="px-3 py-3">
                          <span
                            className={`inline-block text-xs font-medium px-2 py-0.5 rounded ${st.className}`}
                          >
                            {translate(st.label)}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <div className="relative" ref={isOpen ? menuRef : null}>
                            <button
                              type="button"
                              className="w-8 h-8 inline-flex items-center justify-center rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200"
                              onClick={() => setOpenMenuId(isOpen ? null : p.id)}
                            >
                              <span className="fi-rr-menu-dots-vertical" />
                            </button>
                            {isOpen && (
                              <ul className="absolute right-0 mt-2 w-36 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-30">
                                <li>
                                  <a
                                    href={API.ADMIN_OFFLINE_PAYMENT_DOC(p.id)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="block px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                                    onClick={() => setOpenMenuId(null)}
                                  >
                                    {translate('Download')}
                                  </a>
                                </li>
                                {p.status !== 1 && (
                                  <li>
                                    <button
                                      type="button"
                                      className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                                      onClick={() => doAccept(p.id)}
                                    >
                                      {translate('Accept')}
                                    </button>
                                  </li>
                                )}
                                {p.status === 0 && (
                                  <li>
                                    <button
                                      type="button"
                                      className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                                      onClick={() => {
                                        setOpenMenuId(null);
                                        setConfirm({
                                          open: true,
                                          title: translate('Decline this payment?'),
                                          onConfirm: () => doDecline(p.id),
                                        });
                                      }}
                                    >
                                      {translate('Decline')}
                                    </button>
                                  </li>
                                )}
                                <li>
                                  <button
                                    type="button"
                                    className="w-full text-left px-3 py-1.5 text-sm text-rose-600 hover:bg-rose-50"
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      setConfirm({
                                        open: true,
                                        title: translate('Delete this payment?'),
                                        onConfirm: () => doDelete(p.id),
                                      });
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
                    );
                  })}
                </tbody>
              </table>
            </div>

            <Pagination
              meta={meta}
              onPageChange={(p) => {
                const next = new URLSearchParams(searchParams);
                next.set('page', String(p));
                setSearchParams(next);
              }}
            />
          </>
        )}
      </div>

      <ConfirmModal
        isOpen={confirm.open}
        onClose={() => setConfirm({ open: false })}
        onConfirm={confirm.onConfirm}
        title={confirm.title}
        message={translate("You can't bring it back!")}
      />
    </>
  );
}
