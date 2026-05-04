/**
 * AdminInstructorPayouts — port of admin/instructor/payout.blade.php.
 * Pending / Completed tabs with date-range filter and running total.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import NoData from '@/components/common/NoData';
import Pagination from '@/components/common/Pagination';
import { useApi } from '@/hooks/useApi';
import { useSettings } from '@/contexts/SettingsContext';
import { API } from '@/config/routes';

function toDateInputValue(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function AdminInstructorPayouts() {
  const { translate, getImage, formatCurrency } = useSettings();
  const { get, post } = useApi();

  const [tab, setTab] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(null);
  const [items, setItems] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);

  const defaultRange = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - 1);
    return { start: toDateInputValue(start), end: toDateInputValue(end) };
  }, []);
  const [range, setRange] = useState(defaultRange);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const status = tab === 'pending' ? 0 : 1;
      const res = await get(API.ADMIN_INSTRUCTOR_PAYOUTS, {
        params: { status, page, start_date: range.start, end_date: range.end },
      });
      setItems(res.data || []);
      setMeta(res.meta || null);
      setTotalAmount(Number(res.total_amount ?? res.meta?.total_amount ?? 0));
    } catch {
      toast.error(translate('Failed to load payouts'));
    } finally {
      setLoading(false);
    }
  }, [get, tab, page, range, translate]);

  useEffect(() => { fetchItems(); }, [fetchItems]);
  useEffect(() => { setPage(1); }, [tab]);

  const handlePay = async (payout) => {
    setPaying(payout.id);
    try {
      const res = await post(`${API.ADMIN_INSTRUCTOR_PAYOUTS}/${payout.id}/pay`, {
        user_id: payout.user_id,
        amount: payout.amount,
      });
      const data = res.data || res;
      if (data.redirect_url) {
        window.location.href = data.redirect_url;
        return;
      }
      toast.success(translate('Payout processed'));
      fetchItems();
    } catch {
      toast.error(translate('Failed to process payout'));
    } finally {
      setPaying(null);
    }
  };

  const fmtDate = (iso) => {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString(undefined, {
      weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
    });
  };

  return (
    <>
      <div className="bg-white border border-gray-100 rounded-lg mb-4">
        <div className="flex items-center justify-between px-5 py-3 flex-wrap gap-3">
          <h4 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <i className="fi-rr-settings-sliders" />
            {translate('Instructor Payout')}
          </h4>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-lg p-4">
        <div className="flex gap-1 border-b border-gray-200">
          {['pending', 'completed'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
                tab === t
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-gray-600 hover:text-emerald-700'
              }`}
            >
              {translate(t === 'pending' ? 'Pending payouts' : 'Completed payouts')}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{translate('Start date')}</label>
            <input
              type="date"
              value={range.start}
              onChange={(e) => setRange((r) => ({ ...r, start: e.target.value }))}
              className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{translate('End date')}</label>
            <input
              type="date"
              value={range.end}
              onChange={(e) => setRange((r) => ({ ...r, end: e.target.value }))}
              className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => { setPage(1); fetchItems(); }}
              className="w-full px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {translate('Filter')}
            </button>
          </div>
        </div>

        <div className="mt-6">
          {loading ? (
            <LoadingSpinner />
          ) : items.length === 0 ? (
            <NoData />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase text-gray-500 border-b border-gray-200">
                      <th className="px-3 py-2">#</th>
                      <th className="px-3 py-2">{translate('Name')}</th>
                      <th className="px-3 py-2">{translate('Payout amount')}</th>
                      {tab === 'completed' && <th className="px-3 py-2">{translate('Payment type')}</th>}
                      <th className="px-3 py-2">{translate('Payout date')}</th>
                      {tab === 'pending' && <th className="px-3 py-2 text-center">{translate('Option')}</th>}
                      {tab === 'completed' && <th className="px-3 py-2 text-center">{translate('Invoice')}</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((p, i) => (
                      <tr key={p.id} className="border-b border-gray-100 align-middle">
                        <td className="px-3 py-3">{(meta?.from || 1) + i}</td>
                        <td className="px-3 py-3 min-w-[220px]">
                          <div className="flex items-center gap-3">
                            <img
                              className="w-10 h-10 rounded-full object-cover"
                              src={getImage ? getImage(p.user?.photo) : p.user?.photo}
                              alt=""
                            />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{p.user?.name || '—'}</p>
                              <p className="text-xs text-gray-500">{p.user?.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-gray-900">{formatCurrency(p.amount)}</td>
                        {tab === 'completed' && (
                          <td className="px-3 py-3 text-gray-700">
                            {Number(p.status) !== 0 ? translate('Paid') : translate('Pending')}
                          </td>
                        )}
                        <td className="px-3 py-3 text-gray-700">
                          {fmtDate(tab === 'completed' ? p.updated_at : p.created_at)}
                        </td>
                        {tab === 'pending' && (
                          <td className="px-3 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => handlePay(p)}
                              disabled={paying === p.id}
                              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                            >
                              <i className="fi-rr-credit-card" />
                              {paying === p.id ? translate('Processing...') : translate('Pay')}
                            </button>
                          </td>
                        )}
                        {tab === 'completed' && (
                          <td className="px-3 py-3 text-center">
                            <Link
                              to={`/admin/instructor-payouts/${p.id}/invoice`}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
                            >
                              {translate('Invoice')}
                            </Link>
                          </td>
                        )}
                      </tr>
                    ))}
                    <tr className="bg-gray-50">
                      <td colSpan={2} />
                      <td className="px-3 py-3 font-semibold text-gray-900">
                        {translate('Total')}: {formatCurrency(totalAmount)}
                      </td>
                      <td colSpan={tab === 'pending' ? 2 : 3} />
                    </tr>
                  </tbody>
                </table>
              </div>

              <Pagination meta={meta} onPageChange={setPage} />
            </>
          )}
        </div>
      </div>
    </>
  );
}
