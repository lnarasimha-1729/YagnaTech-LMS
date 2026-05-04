/**
 * AdminTeamInvoice — port of admin/team_training/invoice.blade.php.
 * Printable invoice for a single team package purchase.
 */

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useApi } from '@/hooks/useApi';
import { useSettings } from '@/contexts/SettingsContext';
import { API } from '@/config/routes';

function formatDate(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function AdminTeamInvoice() {
  const { id } = useParams();
  const { translate, formatCurrency } = useSettings();
  const { get } = useApi();
  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await get(API.ADMIN_TEAM_PACKAGE_INVOICE(id));
        setInvoice(res.data || res);
      } catch {
        toast.error(translate('Failed to load invoice'));
      } finally {
        setLoading(false);
      }
    })();
  }, [get, id, translate]);

  if (loading) return <LoadingSpinner />;
  if (!invoice) return null;

  const user = invoice.user || {};

  return (
    <>
      <div className="bg-white border border-gray-100 rounded-lg mb-4 print:hidden">
        <div className="flex items-center justify-between px-5 py-3 flex-wrap gap-3">
          <h4 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <i className="fi-rr-settings-sliders" />
            {translate('Invoice')}
          </h4>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <i className="fi-rr-print" />
            <span>{translate('Print')}</span>
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-lg p-6">
        <div className="pb-5 border-b border-gray-200 mb-6">
          <h5 className="text-base font-semibold text-gray-900 mb-2 capitalize">
            {translate('Invoice')}
          </h5>
          <p className="text-sm text-gray-600 break-all">{invoice.invoice || invoice.invoice_no}</p>
          <ul className="mt-4 space-y-1 max-w-xs">
            <li className="flex justify-between text-sm">
              <span className="text-gray-600 capitalize">{translate('Issue Date')}</span>
              <span className="text-gray-900 font-medium">{formatDate(new Date())}</span>
            </li>
            <li className="flex justify-between text-sm">
              <span className="text-gray-600 capitalize">{translate('Purchase Date')}</span>
              <span className="text-gray-900 font-medium">{formatDate(invoice.created_at)}</span>
            </li>
          </ul>
        </div>

        <div className="pb-5 border-b border-gray-200 mb-6">
          <div className="flex flex-wrap justify-between gap-4">
            <div>
              <h4 className="text-base font-semibold text-gray-900 mb-3 capitalize">
                {translate('Invoice To')}
              </h4>
              <ul className="space-y-1 text-sm text-gray-700 capitalize">
                <li>{user.name}</li>
                <li className="normal-case">{user.email}</li>
                {user.address && <li>{user.address}</li>}
                {user.phone && <li>{user.phone}</li>}
              </ul>
            </div>

            <div className="w-full max-w-xs">
              <h4 className="text-base font-semibold text-gray-900 mb-3 capitalize">
                {translate('Payment Details')}
              </h4>
              <ul className="space-y-1 text-sm">
                <li className="flex justify-between">
                  <span className="text-gray-600 capitalize">{translate('Total')}</span>
                  <span className="text-gray-900 font-medium">{formatCurrency(invoice.price)}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600 capitalize">{translate('Due')}</span>
                  <span className="text-gray-900 font-medium">{formatCurrency(invoice.price)}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600 capitalize">{translate('Payment Method')}</span>
                  <span className="text-gray-900 font-medium capitalize">
                    {invoice.payment_method}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs uppercase text-gray-500 border-b border-gray-200">
                <th className="px-3 py-2 text-left">{translate('Description')}</th>
                <th className="px-3 py-2 text-center">{translate('Quantity')}</th>
                <th className="px-3 py-2 text-center">{translate('Price')}</th>
                <th className="px-3 py-2 text-right">{translate('Amount')}</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="px-3 py-3">{invoice.title}</td>
                <td className="px-3 py-3 text-center">1</td>
                <td className="px-3 py-3 text-center">{formatCurrency(invoice.price)}</td>
                <td className="px-3 py-3 text-right">{formatCurrency(invoice.price)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
