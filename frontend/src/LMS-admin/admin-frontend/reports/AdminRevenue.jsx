/**
 * AdminRevenue - Admin revenue report.
 *
 * ============================================================================
 * ORIGINAL BLADE: resources/views/admin/report/admin_revenue.blade.php
 * ============================================================================
 *
 * Paginated table of revenue records with date-range filter.
 * Shows enrolled course, total amount, admin revenue, enrollment date.
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

export default function AdminRevenue() {
  const { translate, formatCurrency } = useSettings();
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
      const res = await get(API.ADMIN_REVENUE, { params });
      setReports(res.data || []);
      setMeta(res.meta || null);
    } catch {
      toast.error(translate('Failed to load revenue data'));
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
            {translate('Admin Revenue')}
          </h4>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-lg p-4">
        <div className="">
          {loading ? (
            <LoadingSpinner />
          ) : reports.length === 0 ? (
            <NoData message={translate('No revenue data found')} />
          ) : (
            <>
              <div className="overflow-x-auto overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>{translate('Enrolled course')}</th>
                      <th>{translate('Total amount')}</th>
                      <th>{translate('Admin revenue')}</th>
                      <th>{translate('Enrolled')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((report, idx) => (
                      <tr key={report.id || idx}>
                        <td>{(meta?.from || 1) + idx}</td>
                        <td>{report.course_title || report.bootcamp_title || '-'}</td>
                        <td>{formatCurrency(report.total_amount)}</td>
                        <td>{formatCurrency(report.admin_revenue)}</td>
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
