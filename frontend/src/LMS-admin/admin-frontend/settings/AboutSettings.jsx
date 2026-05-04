/**
 * AboutSettings - System information / about page.
 *
 * ============================================================================
 * ORIGINAL BLADE: resources/views/admin/setting/about.blade.php
 * ============================================================================
 *
 * Read-only display of software version, Laravel version, PHP version,
 * extension status, purchase code, license, and support info.
 */

import { useEffect, useState } from 'react';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useApi } from '@/hooks/useApi';
import { useSettings } from '@/contexts/SettingsContext';

const ENDPOINT = '/api/admin/settings/about';

export default function AboutSettings() {
  const { translate } = useSettings();
  const { get } = useApi();
  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState({});

  useEffect(() => {
    (async () => {
      try {
        const res = await get(ENDPOINT);
        setInfo(res.data || res || {});
      } catch { /* fallback */ }
      finally { setLoading(false); }
    })();
  }, [get]);

  if (loading) return <LoadingSpinner />;

  const rows = [
    { label: 'Software version', value: info.version },
    { label: 'Laravel version', value: info.laravel_version },
    { label: 'PHP version', value: info.php_version },
    {
      label: 'Curl enable',
      value: info.curl_enabled ? (
        <span className="eBadge ebg-soft-success">{translate('Enabled')}</span>
      ) : (
        <span className="eBadge ebg-soft-danger">{translate('Disabled')}</span>
      ),
    },
    {
      label: 'Fileinfo extension',
      value: info.fileinfo_enabled ? (
        <span className="inline-block text-xs font-medium px-2 py-0.5 rounded bg-green-500">{translate('Enabled')}</span>
      ) : (
        <span className="inline-block text-xs font-medium px-2 py-0.5 rounded bg-red-500">{translate('Disabled')}</span>
      ),
    },
    { label: 'Purchase code', value: info.purchase_code },
    {
      label: 'Product license',
      value: info.product_license === 'valid' ? (
        <span className="inline-block text-xs font-medium px-2 py-0.5 rounded bg-green-500 capitalize">{info.product_license}</span>
      ) : (
        <span className="inline-block text-xs font-medium px-2 py-0.5 rounded bg-red-500 capitalize">{info.product_license}</span>
      ),
    },
    {
      label: 'Customer support status',
      value:
        String(info.purchase_code_status).toLowerCase() === 'valid' ? (
          <span className="inline-block text-xs font-medium px-2 py-0.5 rounded bg-green-500 capitalize">{info.purchase_code_status}</span>
        ) : (
          <span className="inline-block text-xs font-medium px-2 py-0.5 rounded bg-red-500 capitalize">{info.purchase_code_status}</span>
        ),
    },
    { label: 'Support expiry date', value: info.support_expiry_date },
    { label: 'Customer name', value: info.customer_name },
  ];

  return (
    <>
      <div className="bg-white border border-gray-100 rounded-lg">
        <div className="px-5 my-3 py-4">
          <h4 className="title text-base">
            <i className="fi-rr-settings-sliders mr-2" />
            {translate('About This Application')}
          </h4>
        </div>
      </div>

      <div className="flex flex-wrap mt-4">
        <div className="w-full md:w-7/12">
          <div className="bg-white border border-gray-100 rounded-lg p-4">
            <p className="title text-sm mb-3">{translate('About this application')}</p>
            <div className="">
              <div className="chart-widget-list">
                {rows.map((r, i) => (
                  <p className="border-b border-gray-200 text-13px flex items-center mb-2 pb-2" key={i}>
                    <i className="fi-rr-hand-back-point-right mr-3" />
                    {translate(r.label)}
                    <span className="ml-auto">{r.value || '—'}</span>
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
