/**
 * AdminTeamPurchases — port of admin/team_training/purchase_history.blade.php.
 * Paginated table of team training package purchases with per-row invoice link.
 */

import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import NoData from '@/components/common/NoData';
import Pagination from '@/components/common/Pagination';
import { useApi } from '@/hooks/useApi';
import { useSettings } from '@/contexts/SettingsContext';
import { API } from '@/config/routes';

export default function AdminTeamPurchases() {
  const { translate, formatCurrency, getImage } = useSettings();
  const { get } = useApi();
  const [searchParams, setSearchParams] = useSearchParams();

  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);

  const page = searchParams.get('page') || '1';

  const fetchPurchases = useCallback(async () => {
    setLoading(true);
    try {
      const res = await get(API.ADMIN_TEAM_PACKAGE_PURCHASES, { params: { page } });
      setRows(res.data || []);
      setMeta(res.meta || null);
    } catch {
      toast.error(translate('Failed to load purchase history'));
    } finally {
      setLoading(false);
    }
  }, [get, page, translate]);

  useEffect(() => { fetchPurchases(); }, [fetchPurchases]);

  return (
    <>
      <div className="bg-white border border-gray-100 rounded-lg mb-4">
        <div className="px-5 py-3">
          <h4 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <i className="fi-rr-settings-sliders" />
            {translate('Purchase History')}
          </h4>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-lg p-4">
        {loading ? (
          <LoadingSpinner />
        ) : rows.length === 0 ? (
          <NoData />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase text-gray-500 border-b border-gray-200">
                    <th className="px-3 py-2">#</th>
                    <th className="px-3 py-2">{translate('User')}</th>
                    <th className="px-3 py-2">{translate('Package')}</th>
                    <th className="px-3 py-2">{translate('Price')}</th>
                    <th className="px-3 py-2 text-center">{translate('Issue date')}</th>
                    <th className="px-3 py-2 text-center">{translate('Gateway')}</th>
                    <th className="px-3 py-2 text-center">{translate('Options')}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, idx) => (
                    <tr key={r.id} className="border-b border-gray-100 align-middle">
                      <td className="px-3 py-3">{(meta?.from || 1) + idx}</td>
                      <td className="px-3 py-3 min-w-[200px]">
                        <div className="flex items-center gap-3">
                          <img
                            src={getImage ? getImage(r.user?.photo) : r.user?.photo}
                            alt=""
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{r.user?.name}</p>
                            <p className="text-xs text-gray-500">{r.user?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 min-w-[150px]">
                        {r.slug ? (
                          <a
                            href={`/team-packages/${r.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm text-gray-900 hover:text-emerald-600"
                          >
                            {r.title}
                          </a>
                        ) : (
                          <span className="text-sm text-gray-900">{r.title}</span>
                        )}
                      </td>
                      <td className="px-3 py-3 min-w-[150px] text-xs text-gray-600">
                        <p className="text-sm font-medium text-gray-900">{formatCurrency(r.price)}</p>
                        <p>
                          <span>{translate('Admin :')} </span>
                          {formatCurrency(r.admin_revenue)}
                        </p>
                        <p>
                          <span>{translate('Author :')} </span>
                          {formatCurrency(r.instructor_revenue)}
                        </p>
                      </td>
                      <td className="px-3 py-3 text-center text-xs text-gray-600">
                        {new Date(r.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-3 py-3 text-center text-xs text-gray-600 capitalize">
                        {r.payment_method}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <Link
                          to={`/admin/team-packages/purchases/${r.id}/invoice`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
                        >
                          {translate('Invoice')}
                        </Link>
                      </td>
                    </tr>
                  ))}
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
    </>
  );
}
