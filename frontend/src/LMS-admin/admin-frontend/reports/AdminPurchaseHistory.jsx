/**
 * AdminPurchaseHistory - Admin purchase history report.
 *
 * ============================================================================
 * ORIGINAL BLADE: resources/views/admin/report/purchase_history.blade.php
 * ============================================================================
 *
 * Paginated table of purchase records with date-range filter.
 * Shows user, item, paid amount, payment method, purchase date, invoice link.
 */

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import NoData from '@/components/common/NoData';
import Pagination from '@/components/common/Pagination';
import { useApi } from '@/hooks/useApi';
import { useSettings } from '@/contexts/SettingsContext';
import { API } from '@/config/routes';

export default function AdminPurchaseHistory() {
  const { translate, formatCurrency, getImage } = useSettings();
  const { get } = useApi();
  const [searchParams, setSearchParams] = useSearchParams();

  const [reports, setReports] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);

  const page = searchParams.get('page') || '1';
  const dateRange = searchParams.get('date_range') || '';

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page };
      if (dateRange) params.date_range = dateRange;
      const res = await get(API.ADMIN_PURCHASE_HISTORY, { params });
      setReports(res.data || []);
      setMeta(res.meta || null);
    } catch {
      toast.error(translate('Failed to load purchase history'));
    } finally {
      setLoading(false);
    }
  }, [get, page, dateRange, translate]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const updateFilter = (patch) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([k, v]) => {
      if (!v) next.delete(k);
      else next.set(k, v);
    });
    if (!('page' in patch)) next.delete('page');
    setSearchParams(next);
  };

  return (
    <>
      <div className="bg-white border border-gray-100 rounded-lg">
        <div className="px-5 my-3 py-4">
          <h4 className="title text-base">
            <i className="fi-rr-settings-sliders mr-2" />
            {translate('Purchase History')}
          </h4>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-lg p-4">
        <div className="">
          {loading ? (
            <LoadingSpinner />
          ) : reports.length === 0 ? (
            <NoData message={translate('No purchase history found')} />
          ) : (
            <>
              <div className="overflow-x-auto overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>{translate('User')}</th>
                      <th>{translate('Item')}</th>
                      <th>{translate('Paid amount')}</th>
                      <th>{translate('Payment method')}</th>
                      <th>{translate('Purchased date')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((report, idx) => (
                      <tr key={report.id || idx}>
                        <td>{(meta?.from || 1) + idx}</td>
                        <td>
                          <div className="dAdmin_profile flex items-center min-w-200px">
                            <div className="dAdmin_profile_img">
                              <img
                                className="img-fluid rounded-full image-45"
                                src={getImage(report.user_photo)}
                                width="45"
                                height="45"
                                alt=""
                              />
                            </div>
                            <div className="ml-1">
                              <h4 className="title text-sm">{report.user_name}</h4>
                              <p className="sub-title2 text-xs">{report.user_email}</p>
                            </div>
                          </div>
                        </td>
                        <td>{report.course_title || report.bootcamp_title || '-'}</td>
                        <td>{formatCurrency(report.paid_amount)}</td>
                        <td>
                          <span className="inline-block text-xs font-medium px-2 py-0.5 rounded bg-gray-500">
                            {report.payment_method || '-'}
                          </span>
                        </td>
                        <td>
                          {report.created_at
                            ? new Date(report.created_at).toLocaleDateString()
                            : ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                meta={meta}
                onPageChange={(p) => updateFilter({ page: String(p) })}
              />
            </>
          )}
        </div>
      </div>
    </>
  );
}
