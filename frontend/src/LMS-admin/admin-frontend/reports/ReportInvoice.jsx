/**
 * ReportInvoice - Printable invoice view for a purchase history record.
 *
 * ============================================================================
 * ORIGINAL BLADE: resources/views/admin/report/report_invoice.blade.php
 * ============================================================================
 */

import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useApi } from '@/hooks/useApi';
import { useSettings } from '@/contexts/SettingsContext';

export default function ReportInvoice() {
  const { id } = useParams();
  const { translate, getCurrency, getImage } = useSettings();
  const { get } = useApi();
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await get(`/api/admin/reports/invoice/${id}`);
      setReport(res.data || res);
    } catch {
      toast.error(translate('Failed to load invoice'));
    } finally {
      setLoading(false);
    }
  }, [get, id, translate]);

  useEffect(() => { load(); }, [load]);

  const handlePrint = () => {
    const el = document.getElementById('purchase_list');
    if (!el) return;
    const html = el.outerHTML;
    const orig = document.body.innerHTML;
    document.body.innerHTML = html;
    window.print();
    document.body.innerHTML = orig;
    window.location.reload();
  };

  const formatDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  if (loading) return <LoadingSpinner />;
  if (!report) return null;

  return (
    <>
      <div className="bg-white border border-gray-100 rounded-lg">
        <div className="py-3 px-5 my-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h4 className="title text-base">
              <i className="fi-rr-settings-sliders mr-2" />
              {translate('Invoice')}
            </h4>
            <Link
              className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors border border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center cg-10px"
              to="/admin/purchase-history"
            >
              <span className="fi-rr-arrow-left" />
              <span>{translate('Back')}</span>
            </Link>
          </div>
        </div>
      </div>

      <div id="purchase_list" className="flex flex-wrap purchase_list">
        <div className="w-full">
          <div className="bg-white border border-gray-100 rounded-lg p-4">
            <div className="">
              <div className="p-5 pt-3">
                <div className="flex flex-wrap mt-4">
                  <div className="w-full sm:w-1/2">
                    <h4 className="title text-lg mt-3">{translate('Invoice')}</h4>
                    <h3 className="eh5 mt-2">#{report.invoice}</h3>

                    <h6 className="title text-lg mt-4">{translate('Billed To')}</h6>
                    <address>
                      {report.user_name}, {report.user_email}
                    </address>
                  </div>

                  <div className="col-auto ml-auto">
                    <div className="flex justify-between">
                      <div className="mt-3">
                        {report.logo && (
                          <img src={getImage(report.logo)} width="200" alt="" />
                        )}
                        <div className="mt-4 pl-3">
                          <h6 className="title text-xs">{translate('Issue Date')}</h6>
                          <address>{formatDate(report.created_at)}</address>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap">
                  <div className="w-full">
                    <div className="overflow-x-auto">
                      <table className="mt-4 w-full">
                        <thead>
                          <tr>
                            <th>{translate('Item')}</th>
                            <th>{translate('Instructor')}</th>
                            <th>{translate('Qty/Hr Rate')}</th>
                            <th className="text-right">{translate('Amount')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="min-w-250px"><b>{report.course_title}</b></td>
                            <td className="min-w-250px"><b>{report.instructor_name}</b></td>
                            <td className="min-w-250px">1</td>
                            <td className="min-w-250px">{getCurrency(report.amount)}</td>
                          </tr>
                          <tr>
                            <td />
                            <td />
                            <td className="min-w-250px">
                              <p><span>{translate('Subtotal')}</span></p>
                              <p><span>{translate('Tax')}</span></p>
                              <p><span>{translate('Grand total')}</span></p>
                            </td>
                            <td className="min-w-250px">
                              <p><span>{getCurrency(report.amount)}</span></p>
                              <p><span>{getCurrency(report.tax || 0)}</span></p>
                              <p><span>{getCurrency((report.amount || 0) - (report.tax || 0))}</span></p>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="d-print-none mt-4">
                  <div className="text-right">
                    <button className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-emerald-600 text-white hover:bg-emerald-700" type="button" onClick={handlePrint}>
                      <i className="fi-rr-print mr-1" />
                      {translate('Print')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
