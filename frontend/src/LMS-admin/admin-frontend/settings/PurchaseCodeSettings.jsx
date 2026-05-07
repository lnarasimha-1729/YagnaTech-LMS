/**
 * PurchaseCodeSettings - Save/validate purchase code.
 *
 * ============================================================================
 * ORIGINAL BLADE: resources/views/admin/setting/save_purchase_code.blade.php
 * ============================================================================
 */

import { useState } from 'react';
import toast from 'react-hot-toast';
import { useApi } from '@/hooks/useApi';
import { useSettings } from '@/contexts/SettingsContext';

export default function PurchaseCodeSettings() {
  const { translate } = useSettings();
  const { post } = useApi();
  const [code, setCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!code.trim()) return;
    setError('');
    setSaving(true);
    try {
      const res = await post('/api/admin/settings/purchase-code', { purchase_code: code });
      const data = res.data || res;
      if (data.success || data === 1) {
        toast.success(translate('Purchase code saved'));
        setCode('');
      } else {
        setError(translate('Invalid purchase code'));
      }
    } catch {
      setError(translate('Invalid purchase code'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="bg-white border border-gray-100 rounded-lg">
        <div className="px-5 my-3 py-4">
          <h4 className="title text-base">
            <i className="fi-rr-settings-sliders mr-2" />
            {translate('Purchase Code')}
          </h4>
        </div>
      </div>

      <div className="flex flex-wrap">
        <div className="w-full md:w-1/2">
          <div className="bg-white border border-gray-100 rounded-lg p-4">
            <div className="">
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="purchase_code">
                  {translate('Purchase code')}
                </label>
                <input
                  id="purchase_code"
                  className={`w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500${error ? 'is-invalid' : ''}`}
                  type="text"
                  value={code}
                  onChange={(e) => { setCode(e.target.value); setError(''); }}
                />
                {error && <div className="text-red-500 text-xs mt-1">{error}</div>}
              </div>
              <button
                className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-emerald-600 text-white hover:bg-emerald-700"
                type="button"
                disabled={saving}
                onClick={handleSubmit}
              >
                {saving ? translate('Saving...') : translate('Submit')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
