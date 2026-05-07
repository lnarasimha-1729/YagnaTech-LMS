/**
 * InstructorRevenue - Instructor revenue report with date-range filter.
 *
 * ============================================================================
 * ORIGINAL BLADE: resources/views/admin/report/instructor_revenue.blade.php
 * ============================================================================
 */

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import NoData from '@/components/common/NoData';
import Pagination from '@/components/common/Pagination';
import ConfirmModal from '@/components/common/ConfirmModal';
import { useApi } from '@/hooks/useApi';
import { useSettings } from '@/contexts/SettingsContext';

export default function InstructorRevenue() {
  const { translate, getCurrency } = useSettings();
  const { get, del } = useApi();
  const [searchParams, setSearchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [totals, setTotals] = useState({ amount: 0, instructor_revenue: 0 });
  const [confirm, setConfirm] = useState(null);

  const page = Number(searchParams.get('page') || 1);
  const dateFrom = searchParams.get('date_from') || '';
  const dateTo = searchParams.get('date_to') || '';

  const [dateRange, setDateRange] = useState({ from: dateFrom, to: dateTo });

  const currency = (v) => (getCurrency ? getCurrency(v) : `$${Number(v || 0).toFixed(2)}`);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      qs.set('page', page);
      if (dateFrom) qs.set('date_from', dateFrom);
      if (dateTo) qs.set('date_to', dateTo);
      const res = await get(`/api/admin/reports/instructor-revenue?${qs}`);
      const data = res.data || res;
      setReports(data.data || data.reports || []);
      setPagination({
        current_page: data.current_page || 1,
        last_page: data.last_page || 1,
        total: data.total || 0,
      });
      setTotals({
        amount: data.total_amount || 0,
        instructor_revenue: data.total_instructor_revenue || 0,
      });
    } catch {
      toast.error(translate('Failed to load'));
    } finally {
      setLoading(false);
    }
  }, [get, page, dateFrom, dateTo, translate]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const applyFilter = (e) => {
    e.preventDefault();
    const next = new URLSearchParams(searchParams);
    if (dateRange.from) next.set('date_from', dateRange.from);
    else next.delete('date_from');
    if (dateRange.to) next.set('date_to', dateRange.to);
    else next.delete('date_to');
    next.delete('page');
    setSearchParams(next);
  };

  const handleDelete = async (id) => {
    try {
      await del(`/api/admin/reports/instructor-revenue/${id}`);
      toast.success(translate('Deleted'));
      fetchReports();
    } catch {
      toast.error(translate('Failed to delete'));
    } finally {
      setConfirm(null);
    }
  };

  return (
    <>
      <div className="bg-white border border-gray-100 rounded-lg">
        <div className="px-5 my-3 py-4">
          <h4 className="title text-base mb-0">
            <i className="fi-rr-settings-sliders mr-2" />
            {translate('Instructor Revenue')}
          </h4>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-lg p-4">
        <div className="">
          <div className="flex flex-wrap row-gap-3 mb-3 mt-3">
            <div className="w-full md:w-1/2 pt-md-0 pt-2">
              <button type="button" className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200" onClick={() => window.print()}>
                {translate('Print')} <i className="fi-rr-print ml-2" />
              </button>
            </div>
            <div className="w-full md:w-1/2">
              <form onSubmit={applyFilter}>
                <div className="flex flex-wrap row-gap-3">
                  <div className="w-full md:w-1/3">
                    <input
                      className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      type="date"
                      value={dateRange.from}
                      onChange={(e) => setDateRange((d) => ({ ...d, from: e.target.value }))}
                    />
                  </div>
                  <div className="w-full md:w-1/3">
                    <input
                      className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      type="date"
                      value={dateRange.to}
                      onChange={(e) => setDateRange((d) => ({ ...d, to: e.target.value }))}
                    />
                  </div>
                  <div className="w-full md:w-1/3">
                    <button type="submit" className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-emerald-600 text-white hover:bg-emerald-700 w-full">
                      {translate('Filter')}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {loading ? (
            <LoadingSpinner />
          ) : reports.length === 0 ? (
            <NoData />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>{translate('Enrolled course')}</th>
                      <th>{translate('Total amount')}</th>
                      <th>{translate('Instructor revenue')}</th>
                      <th>{translate('Enrolled')}</th>
                      <th>{translate('Option')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((r, idx) => (
                      <tr key={r.id}>
                        <td>{(pagination.current_page - 1) * 10 + idx + 1}</td>
                        <td>
                          <h4 className="title text-sm">{r.course_title || r.course?.title || '—'}</h4>
                          <p className="text-xs mt-1">
                            {translate('Enrolled')}: {r.enrolled_date || r.created_at?.slice(0, 10)}
                          </p>
                          {r.coupon && <p>{translate('Coupon')}: {r.coupon}</p>}
                        </td>
                        <td>{currency(r.amount)}</td>
                        <td>{currency(r.instructor_revenue)}</td>
                        <td>{r.enrolled_date || r.created_at?.slice(0, 10)}</td>
                        <td>
                          <button
                            className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200 ol-icon-btn"
                            type="button"
                            title={translate('Delete')}
                            onClick={() => setConfirm({ id: r.id })}
                          >
                            <i className="fi-rr-trash" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    <tr>
                      <th />
                      <th />
                      <th>{translate('Total')}: {currency(totals.amount)}</th>
                      <th>{translate('Total')}: {currency(totals.instructor_revenue)}</th>
                      <th />
                      <th />
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center flex-wrap gap-2">
                <p className="admin-tInfo mb-0">
                  {translate('Showing')} {reports.length} {translate('of')} {pagination.total} {translate('data')}
                </p>
                {pagination.last_page > 1 && (
                  <Pagination
                    currentPage={pagination.current_page}
                    lastPage={pagination.last_page}
                    onPageChange={(p) => {
                      const next = new URLSearchParams(searchParams);
                      next.set('page', p);
                      setSearchParams(next);
                    }}
                  />
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {confirm && (
        <ConfirmModal
          message={translate('Delete this record?')}
          onConfirm={() => handleDelete(confirm.id)}
          onCancel={() => setConfirm(null)}
        />
      )}
    </>
  );
}
