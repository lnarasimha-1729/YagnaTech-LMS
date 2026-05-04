/**
 * PaymentSettings - Admin payment gateway settings.
 *
 * ============================================================================
 * ORIGINAL BLADE: resources/views/admin/setting/payment_setting.blade.php
 * ============================================================================
 *
 * Vertical pill tabs:
 *   - Currency Settings (system currency + position)
 *   - One tab per payment gateway (dynamic, from DB):
 *       Each gateway has: active status, test mode, currency, and
 *       dynamic "keys" fields (stripe secret/public, paypal id, etc).
 *     Offline gateway is a special case with textareas instead of inputs.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useApi } from '@/hooks/useApi';
import { useSettings } from '@/contexts/SettingsContext';
import { API } from '@/config/routes';

const CURRENCY_POSITIONS = [
  ['left', 'Left'],
  ['right', 'Right'],
  ['left-space', 'Left with a space'],
  ['right-space', 'Right with a space'],
];

export default function PaymentSettings() {
  const { translate } = useSettings();
  const { get, post } = useApi();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('currency');
  const [currencies, setCurrencies] = useState([]);
  const [gateways, setGateways] = useState([]);
  const [currencyForm, setCurrencyForm] = useState({
    system_currency: '',
    currency_position: 'left',
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await get(API.ADMIN_PAYMENT_SETTINGS);
      setCurrencies(res.currencies || []);
      setGateways(res.gateways || []);
      setCurrencyForm({
        system_currency: res.system_currency || '',
        currency_position: res.currency_position || 'left',
      });
    } catch {
      toast.error(translate('Failed to load payment settings'));
    } finally {
      setLoading(false);
    }
  }, [get, translate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const saveCurrency = async (e) => {
    e.preventDefault();
    try {
      await post(API.ADMIN_PAYMENT_SETTINGS, {
        top_part: 'top_part',
        ...currencyForm,
      });
      toast.success(translate('Currency settings saved'));
      fetchData();
    } catch {
      toast.error(translate('Failed to save'));
    }
  };

  const saveGateway = async (gateway, formState) => {
    try {
      await post(API.ADMIN_PAYMENT_SETTINGS, {
        identifier: gateway.identifier,
        ...formState,
      });
      toast.success(translate('Gateway settings saved'));
      fetchData();
    } catch {
      toast.error(translate('Failed to save'));
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <div className="bg-white border border-gray-100 rounded-lg">
        <div className="px-5 my-3 py-4">
          <h4 className="title text-base">
            <i className="fi-rr-settings-sliders mr-2" />
            {translate('Payment Settings')}
          </h4>
        </div>
      </div>

      <div className="flex flex-wrap">
        <div className="w-full md:w-10/12">
          <div className="bg-white border border-gray-100 rounded-lg">
            <div className="">
              <div className="flex  flex-wrap gap-3">
                {/* Sidebar tabs */}
                <div className="w-full md:w-48 shrink-0">
                  <div className="nav flex-column flex gap-2" role="tablist">
                    <button
                      className={`px-3 py-2 text-sm text-gray-600 hover:text-emerald-600 ${activeTab === 'currency' ? 'border-b-2 border-emerald-600 text-emerald-700 font-medium -mb-px' : ''}`}
                      type="button"
                      onClick={() => setActiveTab('currency')}
                    >
                      <span>{translate('Currency Settings')}</span>
                    </button>
                    <hr />
                    {gateways.map((gateway) => (
                      <button
                        key={gateway.identifier}
                        className={`px-3 py-2 text-sm text-gray-600 hover:text-emerald-600 ${activeTab === gateway.identifier ? 'border-b-2 border-emerald-600 text-emerald-700 font-medium -mb-px' : ''}`}
                        type="button"
                        onClick={() => setActiveTab(gateway.identifier)}
                      >
                        <span>{gateway.title}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tab content */}
                <div className="w-full">
                  {activeTab === 'currency' && (
                    <div>
                      <h3 className="title text-sm mb-3">{translate('Currency settings')}</h3>
                      <div className="p-4 rounded-lg mb-4 bg-emerald-50 text-emerald-700 border border-emerald-100 ">
                        <p className="sub-title2 text-base">
                          <span className="title2">{translate('Heads up !!')} </span>
                          {translate(
                            'Ensure that the system currency and all active payment gateway currencies are same'
                          )}
                        </p>
                      </div>
                      <div className="">
                        <form onSubmit={saveCurrency}>
                          <div className="fpb-7 mb-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                              {translate('Select currency')}
                            </label>
                            <select
                              className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                              value={currencyForm.system_currency}
                              onChange={(e) =>
                                setCurrencyForm((prev) => ({
                                  ...prev,
                                  system_currency: e.target.value,
                                }))
                              }
                              required
                            >
                              <option value="">{translate('Select currency')}</option>
                              {currencies.map((c) => (
                                <option key={c.code} value={c.code}>
                                  {c.code}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="fpb-7 mb-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                              {translate('Currency position')}
                            </label>
                            <select
                              className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                              value={currencyForm.currency_position}
                              onChange={(e) =>
                                setCurrencyForm((prev) => ({
                                  ...prev,
                                  currency_position: e.target.value,
                                }))
                              }
                              required
                            >
                              {CURRENCY_POSITIONS.map(([val, label]) => (
                                <option key={val} value={val}>
                                  {translate(label)}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="fpb-7 mb-3">
                            <button className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-emerald-600 text-white hover:bg-emerald-700 mt-3" type="submit">
                              {translate('Update')}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}

                  {gateways.map(
                    (gateway) =>
                      activeTab === gateway.identifier && (
                        <GatewayForm
                          key={gateway.identifier}
                          gateway={gateway}
                          currencies={currencies}
                          translate={translate}
                          onSave={saveGateway}
                        />
                      )
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ─── Single Gateway Form ────────────────────────────────────────────────── */
function GatewayForm({ gateway, currencies, translate, onSave }) {
  const isOffline = gateway.identifier === 'offline';

  // Normalize keys: payment gateway 'keys' may come as object or JSON string
  const parsedKeys = useMemo(() => {
    if (!gateway.keys) return {};
    if (typeof gateway.keys === 'string') {
      try {
        return JSON.parse(gateway.keys);
      } catch {
        return {};
      }
    }
    return gateway.keys;
  }, [gateway.keys]);

  const [form, setForm] = useState({
    status: String(gateway.status ?? '0'),
    test_mode: String(gateway.test_mode ?? '0'),
    currency: gateway.currency || '',
    ...parsedKeys,
  });

  const update = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    onSave(gateway, form);
  };

  const humanize = (key) =>
    translate(
      key
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase())
    );

  return (
    <div>
      <h3 className="title text-sm mb-3">
        {gateway.title} {translate('settings')}
      </h3>
      <div className="">
        <form onSubmit={submit}>
          {!isOffline ? (
            <>
              <div className="fpb-7 mb-3">
                <label className="capitalize mb-2">{translate('Active')}</label>
                <select
                  className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  value={form.status}
                  onChange={(e) => update('status', e.target.value)}
                >
                  <option value="0">{translate('No')}</option>
                  <option value="1">{translate('Yes')}</option>
                </select>
              </div>
              <div className="fpb-7 mb-3">
                <label className="capitalize mb-2">
                  {translate('Want to keep test mode enabled')}?
                </label>
                <select
                  className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  value={form.test_mode}
                  onChange={(e) => update('test_mode', e.target.value)}
                >
                  <option value="0">{translate('No')}</option>
                  <option value="1">{translate('Yes')}</option>
                </select>
              </div>
              <div className="fpb-7 mb-3">
                <label className="capitalize mb-2">{translate('Select currency')}</label>
                <select
                  className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  value={form.currency}
                  onChange={(e) => update('currency', e.target.value)}
                  required
                >
                  <option value="">{translate('Select currency')}</option>
                  {currencies.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code}
                    </option>
                  ))}
                </select>
              </div>
              {Object.entries(parsedKeys).map(([key]) => (
                <div className="fpb-7 mb-3" key={key}>
                  <label className="capitalize mb-2">{humanize(key)}</label>
                  <input
                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    type={key === 'theme_color' ? 'color' : 'text'}
                    value={form[key] || ''}
                    onChange={(e) => update(key, e.target.value)}
                    required
                  />
                </div>
              ))}
            </>
          ) : (
            <>
              <div className="fpb-7 w-full mb-3">
                <select
                  className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  value={form.status}
                  onChange={(e) => update('status', e.target.value)}
                >
                  <option value="">{translate('Choose an option')}</option>
                  <option value="1">{translate('Active')}</option>
                  <option value="0">{translate('Inactive')}</option>
                </select>
              </div>
              {Object.entries(parsedKeys).map(([key]) => (
                <div className="fpb-7 mb-3" key={key}>
                  <label className="capitalize mb-2">{humanize(key)}</label>
                  <textarea
                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    rows="5"
                    value={form[key] || ''}
                    onChange={(e) => update(key, e.target.value)}
                    required
                  />
                </div>
              ))}
            </>
          )}
          <div className="flex flex-wrap">
            <div className="fpb-7 w-full md:w-1/2 mb-3">
              <button className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors btn-block bg-emerald-600 text-white hover:bg-emerald-700" type="submit">
                {translate('Update')} {gateway.title} {translate('setting')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
