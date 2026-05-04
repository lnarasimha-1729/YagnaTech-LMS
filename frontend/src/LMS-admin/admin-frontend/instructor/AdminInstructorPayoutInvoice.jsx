/**
 * AdminInstructorPayoutInvoice — port of admin/instructor/instructor_invoice.blade.php.
 * Printable payout invoice for a single instructor withdrawal.
 */

import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useApi } from '@/hooks/useApi';
import { useSettings } from '@/contexts/SettingsContext';
import { API } from '@/config/routes';

function formatDate(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString(undefined, { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
}

export default function AdminInstructorPayoutInvoice() {
  const { id } = useParams();
  const { translate, formatCurrency, getSetting } = useSettings();
  const { get } = useApi();

  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await get(API.ADMIN_INSTRUCTOR_PAYOUT_INVOICE(id));
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
  const rows = invoice.items && invoice.items.length ? invoice.items : [{
    type: translate('Withdrawal request'),
    requested: invoice.amount,
    amount: invoice.amount,
  }];
  const darkLogo = getSetting ? getSetting('dark_logo') : null;

  return (
    <>
      <div className="bg-white border border-gray-100 rounded-lg mb-4 print:hidden">
        <div className="flex items-center justify-between px-5 py-3 flex-wrap gap-3">
          <h4 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <i className="fi-rr-settings-sliders" />
            {translate('Invoice')}
          </h4>
          <div className="flex items-center gap-2">
            <Link
              to="/admin/instructor-payouts"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <span className="fi-rr-arrow-alt-left" />
              {translate('Back')}
            </Link>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700"
            >
              <i className="fi-rr-print" />
              {translate('Print')}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-lg p-8">
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">{translate('Invoice')}</h2>
            <p className="mt-2 text-sm text-gray-600">
              {translate('Invoice id')}: #{invoice.id || invoice.invoice_id}
            </p>
          </div>
          {darkLogo && <img src={darkLogo} alt="" className="max-h-12" />}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div>
            <h6 className="text-sm font-semibold text-gray-900 mb-1">{translate('Billed To')}</h6>
            <p className="text-sm text-gray-700">{user.name}</p>
            <p className="text-sm text-gray-600 break-all">{user.email}</p>
          </div>
          <div>
            <h6 className="text-sm font-semibold text-gray-900 mb-1">{translate('Date Of Issue')}</h6>
            <p className="text-sm text-gray-700">{formatDate(invoice.created_at)}</p>
          </div>
          <div>
            <h6 className="text-sm font-semibold text-gray-900 mb-1">{translate('Invoice Total')}</h6>
            <p className="text-sm text-gray-900 font-medium">{formatCurrency(invoice.amount)}</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs uppercase text-gray-500 border-b border-gray-200">
                <th className="px-3 py-2 text-left">#</th>
                <th className="px-3 py-2 text-left">{translate('Type')}</th>
                <th className="px-3 py-2 text-left">{translate('Requested amount')}</th>
                <th className="px-3 py-2 text-right">{translate('Amount')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={idx} className="border-b border-gray-100">
                  <td className="px-3 py-3">{idx + 1}</td>
                  <td className="px-3 py-3">{row.type || translate('Withdrawal request')}</td>
                  <td className="px-3 py-3">{formatCurrency(row.requested ?? row.amount)}</td>
                  <td className="px-3 py-3 text-right">{formatCurrency(row.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end mt-6">
          <div className="text-sm">
            <p className="text-gray-600">
              <span>{translate('Subtotal')}: </span>
              <span className="text-gray-900 font-medium">{formatCurrency(invoice.amount)}</span>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
