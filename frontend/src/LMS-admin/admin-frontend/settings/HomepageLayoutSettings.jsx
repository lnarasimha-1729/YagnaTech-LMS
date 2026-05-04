/**
 * HomepageLayoutSettings - Select active homepage template/theme.
 *
 * ============================================================================
 * ORIGINAL BLADE: resources/views/admin/setting/homepagelayout.blade.php
 * ============================================================================
 */

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useApi } from '@/hooks/useApi';
import { useSettings } from '@/contexts/SettingsContext';

export default function HomepageLayoutSettings() {
  const { translate, getImage } = useSettings();
  const { get, post } = useApi();
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState([]);
  const [activeId, setActiveId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await get('/api/admin/settings/homepage-layout');
      const data = res.data || res;
      setTemplates(data.templates || data || []);
      setActiveId(data.active || null);
    } catch {
      toast.error(translate('Failed to load'));
    } finally {
      setLoading(false);
    }
  }, [get, translate]);

  useEffect(() => { load(); }, [load]);

  const activate = async (id) => {
    try {
      await post('/api/admin/settings/homepage-layout', { template: id, _method: 'PUT' });
      setActiveId(id);
      toast.success(translate('Template activated'));
    } catch {
      toast.error(translate('Failed to activate'));
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="flex flex-wrap">
      {templates.map((tpl) => (
        <div key={tpl.id || tpl.identifier} className="w-full md:w-1/2 mb-4">
          <div className="bg-white border border-gray-100 rounded-lg p-4">
            <div className="p-4">
              <div className="flex justify-center mb-3">
                <div className="theme_box">
                  <div className="theme_image_custom">
                    {tpl.thumbnail ? (
                      <img
                        src={getImage(tpl.thumbnail)}
                        alt={tpl.name}
                        style={{ maxWidth: '100%', maxHeight: 200 }}
                      />
                    ) : (
                      <div
                        className="bg-gray-100 flex items-center justify-center rounded"
                        style={{ width: '100%', height: 160 }}
                      >
                        <span className="text-gray-500">{tpl.name || tpl.identifier}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <h6 className="text-center mb-3">{tpl.name || tpl.identifier}</h6>
              <button
                className={`inline-flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-colors w-full ${(tpl.id || tpl.identifier) === activeId ? 'bg-emerald-600 text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                type="button"
                disabled={(tpl.id || tpl.identifier) === activeId}
                onClick={() => activate(tpl.id || tpl.identifier)}
              >
                {(tpl.id || tpl.identifier) === activeId
                  ? translate('Active')
                  : translate('Activate')}
              </button>
            </div>
          </div>
        </div>
      ))}
      {templates.length === 0 && (
        <div className="w-full">
          <p className="text-gray-500">{translate('No templates available')}</p>
        </div>
      )}
    </div>
  );
}
