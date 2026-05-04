/**
 * AdminInvoice - Printable invoice view for a purchase.
 *
 * ============================================================================
 * ORIGINAL BLADE: resources/views/admin/invoice.blade.php
 * ============================================================================
 *
 * Blade template had placeholder fields; React port fetches real invoice
 * data by ID and renders a print-friendly layout.
 */

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useApi } from '@/hooks/useApi';
import { useSettings } from '@/contexts/SettingsContext';

export default function AdminInvoice() {
  const { id } = useParams();
  const { translate, getImage, getCurrency, getFrontendSetting } = useSettings();
  const { get } = useApi();

  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await get(`/api/admin/invoices/${id}`);
      setInvoice(res.data || res);
    } catch {
      toast.error(translate('Failed to load invoice'));
    } finally {
      setLoading(false);
    }
  }, [get, id, translate]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingSpinner />;
  if (!invoice) return null;

  const items = invoice.items || [];
  const currency = (v) => (getCurrency ? getCurrency(v) : v);

  return (
    <>
      <div className="mainSection-title">
        <h4>{translate('Invoice')}</h4>
      </div>

      <div className="ol-card p-4">
        <div className="ol-card-body">
          <div className="container p-5">
            <div className="flex justify-between">
              <div>
                <h4 className="eDisplay-3">{translate('Invoice')}</h4>
                <h3 className="eh5 mt-2">#{translate('Invoice id')}: {invoice.invoice_number || invoice.id}</h3>
              </div>
              <div>
                <img
                  src={getImage(getFrontendSetting ? getFrontendSetting('dark_logo') : null)}
                  alt=""
                  style={{ maxHeight: 60 }}
                />
              </div>
            </div>

            <div className="flex flex-wrap -mx-3 mt-4">
              <div className="w-full sm:w-1/3">
                <h6>{translate('Billed To')}</h6>
                <address>
                  {invoice.user?.name}<br />
                  {invoice.user?.email}<br />
                  {invoice.user?.phone}
                </address>
              </div>
              <div className="w-full sm:w-1/3">
                <h6>{translate('Date Of Issue')}</h6>
                <address>{invoice.issued_at || invoice.created_at}</address>
              </div>
              <div className="w-full sm:w-1/3">
                <h6>{translate('Invoice Total')}</h6>
                <address>{currency(invoice.total)}</address>
              </div>
            </div>

            <div className="flex flex-wrap -mx-3">
              <div className="w-full">
                <div className="overflow-x-auto">
                  <table className="mt-4 w-full">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>{translate('Type')}</th>
                        <th>{translate('Description')}</th>
                        <th className="text-right">{translate('Total')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((it, i) => (
                        <tr key={it.id || i}>
                          <td>{i + 1}</td>
                          <td>{it.type}</td>
                          <td>{it.description || it.title}</td>
                          <td className="text-right">{currency(it.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap -mx-3">
              <div className="w-full sm:w-1/2" />
              <div className="w-full sm:w-1/2">
                <div className="mt-sm-0 float-end mt-3">
                  <p><b>{translate('Sub total')}:</b> <span className="float-end ml-3">{currency(invoice.subtotal || invoice.total)}</span></p>
                  {invoice.discount != null && (
                    <p><b>{translate('Discount')}:</b> <span className="float-end ml-3">{currency(invoice.discount)}</span></p>
                  )}
                  {invoice.tax != null && (
                    <p><b>{translate('Tax')}:</b> <span className="float-end ml-3">{currency(invoice.tax)}</span></p>
                  )}
                  <p><b>{translate('Total')}:</b> <span className="float-end ml-3">{currency(invoice.total)}</span></p>
                </div>
              </div>
            </div>

            <div className="d-print-none mt-4">
              <div className="text-right">
                <button type="button" className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-indigo-600 text-white hover:bg-indigo-700" onClick={() => window.print()}>
                  <i className="mdi mdi-printer mr-1" />
                  {translate('Print')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
