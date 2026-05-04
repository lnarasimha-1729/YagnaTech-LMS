/**
 * BootcampInvoice - Admin/instructor bootcamp purchase invoice (printable).
 *
 * ============================================================================
 * ORIGINAL BLADES:
 *   resources/views/admin/bootcamp/invoice.blade.php
 *   resources/views/instructor/bootcamp/invoice.blade.php
 * ============================================================================
 */

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useApi } from '@/hooks/useApi';
import { useSettings } from '@/contexts/SettingsContext';

export default function BootcampInvoice({ role = 'admin' }) {
  const { id } = useParams();
  const { translate, getCurrency } = useSettings();
  const { get } = useApi();
  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState(null);

  const prefix = role === 'instructor' ? '/api/instructor' : '/api/admin';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await get(`${prefix}/bootcamp-invoice/${id}`);
      setInvoice(res.data || res);
    } catch {
      toast.error(translate('Failed to load invoice'));
    } finally {
      setLoading(false);
    }
  }, [get, id, prefix, translate]);

  useEffect(() => { load(); }, [load]);

  const formatDate = (d) => {
    if (!d) return '';
    return new Date(typeof d === 'number' ? d * 1000 : d)
      .toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  if (loading) return <LoadingSpinner />;
  if (!invoice) return null;

  return (
    <>
      <div className="ol-card radius-8px print:hidden">
        <div className="ol-card-body py-12px px-20px my-3 py-4">
          <h4 className="title text-base">
            <i className="fi-rr-settings-sliders mr-2" />
            {translate('Invoice')}
          </h4>
        </div>
      </div>

      <div className="ol-card mb-30px">
        <div className="ol-card-body p-20px">
          <div className="pb-20px ol-border-bottom mb-30px">
            <div className="mb-20px">
              <h5 className="title text-base mb-10px capitalize">{translate('Invoice')}</h5>
              <p className="sub-title text-base break-words">{invoice.invoice}</p>
            </div>
            <ul className="ol-list-group-2 max-w-280px">
              <li>
                <span className="title text-base font-normal capitalize">{translate('Issue Date')}</span>
                <span className="title2 text-base">{formatDate(new Date())}</span>
              </li>
              <li>
                <span className="title text-base font-normal capitalize">{translate('Purchase Date')}</span>
                <span className="title2 text-base">{formatDate(invoice.created_at)}</span>
              </li>
            </ul>
          </div>

          <div className="pb-20px ol-border-bottom mb-20px">
            <div className="flex flex-wrap -mx-3">
              <div className="w-full lg:w-10/12">
                <div className="flex justify-between flex-wrap gap-3">
                  <div>
                    <h4 className="title text-lg capitalize mb-20px">{translate('Invoice To')}</h4>
                    <ul className="ol-list-group-2">
                      <li className="title text-base font-normal capitalize">{invoice.user_name}</li>
                      <li className="title text-base font-normal capitalize">{invoice.user_email}</li>
                      {invoice.user_address && <li className="title text-base font-normal capitalize">{invoice.user_address}</li>}
                      {invoice.user_phone && <li className="title text-base font-normal capitalize">{invoice.user_phone}</li>}
                    </ul>
                  </div>
                  <div className="max-w-280px w-full">
                    <h4 className="title text-lg capitalize mb-20px">{translate('Payment Details')}</h4>
                    <ul className="ol-list-group-2 w-full">
                      <li>
                        <span className="title text-base font-normal capitalize">{translate('Total')}</span>
                        <span className="title2 text-base">{getCurrency(invoice.price)}</span>
                      </li>
                      <li>
                        <span className="title text-base font-normal capitalize">{translate('Due')}</span>
                        <span className="title2 text-base">{getCurrency(invoice.price)}</span>
                      </li>
                      <li>
                        <span className="title text-base font-normal capitalize">{translate('Payment Method')}</span>
                        <span className="title2 text-base capitalize">{invoice.payment_method}</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="invoice-table-wrap">
            <div className="overflow-x-auto">
              <table className="ol-table mb-3 w-full whitespace-nowrap">
                <thead>
                  <tr>
                    <th>{translate('Description')}</th>
                    <th className="text-center">{translate('Quantity')}</th>
                    <th className="text-center">{translate('Price')}</th>
                    <th className="text-right">{translate('Amount')}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{invoice.title}</td>
                    <td className="text-center">1</td>
                    <td className="text-center">{getCurrency(invoice.price)}</td>
                    <td className="text-right">{getCurrency(invoice.price)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <button
              className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors ol-btn-light-primary ol-btn-rounded print:hidden"
              type="button"
              onClick={() => window.print()}
            >
              {translate('Print')}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
