/**
 * AdminPageLayout — block-based layout editor for a home-page builder page.
 * Ports page_layout_edit.blade.php + page_layout_edit_offcanvas.blade.php.
 *
 * The original Blade editor is a full visual contenteditable drag-drop builder
 * that mutates server-rendered block partials in-browser. This port provides
 * the pragmatic essentials: ordered list of blocks, add/remove/reorder, per-
 * block field editing via a catalog-provided schema.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useApi } from '@/hooks/useApi';
import { useSettings } from '@/contexts/SettingsContext';
import { API } from '@/config/routes';

export default function AdminPageLayout() {
  const { id } = useParams();
  const { translate } = useSettings();
  const { get, post } = useApi();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(null);
  const [catalog, setCatalog] = useState([]);
  const [blocks, setBlocks] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pageRes, catRes] = await Promise.all([
        get(API.ADMIN_PAGE_LAYOUT(id)),
        get(API.ADMIN_PAGE_BLOCK_CATALOG),
      ]);
      const pageData = pageRes.data || pageRes;
      const catData = catRes.data || catRes;
      setPage(pageData.page || pageData);
      setBlocks(
        (pageData.blocks || []).map((b, i) => ({
          id: b.id ?? `${b.file}-${i}`,
          file: b.file,
          fields: b.fields || {},
        })),
      );
      setCatalog(catData.blocks || catData || []);
    } catch {
      toast.error(translate('Failed to load layout'));
    } finally {
      setLoading(false);
    }
  }, [get, id, translate]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true);
    try {
      await post(API.ADMIN_PAGE_LAYOUT(id), {
        _method: 'PUT',
        blocks: blocks.map(({ file, fields }) => ({ file, fields })),
      });
      toast.success(translate('Layout updated'));
    } catch {
      toast.error(translate('Failed to save'));
    } finally {
      setSaving(false);
    }
  };

  const addBlock = (file) => {
    setBlocks((bs) => [...bs, { id: `${file}-${Date.now()}`, file, fields: {} }]);
  };

  const removeBlock = (idx) => {
    setBlocks((bs) => bs.filter((_, i) => i !== idx));
  };

  const move = (idx, dir) => {
    setBlocks((bs) => {
      const next = [...bs];
      const swap = idx + dir;
      if (swap < 0 || swap >= next.length) return bs;
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next;
    });
  };

  const updateField = (idx, key, value) => {
    setBlocks((bs) => bs.map((b, i) => (i === idx ? { ...b, fields: { ...b.fields, [key]: value } } : b)));
  };

  const catalogByFile = useMemo(() => {
    const map = {};
    catalog.forEach((b) => { map[b.file] = b; });
    return map;
  }, [catalog]);

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <div className="bg-white border border-gray-100 rounded-lg mb-4">
        <div className="flex items-center justify-between px-5 py-3 flex-wrap gap-3">
          <h4 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <i className="fi-rr-settings-sliders" />
            {translate('Page Builder')}
            {page?.name && <span className="text-sm font-normal text-gray-500">— {page.name}</span>}
          </h4>
          <div className="flex items-center gap-2">
            <Link
              to="/admin/pages"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <span className="fi-rr-angle-left" />
              {translate('Back')}
            </Link>
            <Link
              to={`/admin/pages/${id}/preview`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <span className="fi-rr-eye" />
              {translate('Preview')}
            </Link>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              <span className="fi-rr-disk" />
              {saving ? translate('Saving...') : translate('Save')}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <div className="bg-white border border-gray-100 rounded-lg p-4">
            <h5 className="text-sm font-semibold text-gray-900 mb-3">{translate('Page sections')}</h5>
            {blocks.length === 0 ? (
              <p className="text-sm text-gray-500">
                {translate('No sections yet. Add one from the right.')}
              </p>
            ) : (
              <div className="space-y-3">
                {blocks.map((block, idx) => {
                  const schema = catalogByFile[block.file]?.fields || [];
                  return (
                    <div key={block.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start gap-3 mb-3">
                        <div>
                          <div className="text-sm font-semibold text-gray-900">
                            {idx + 1}. {catalogByFile[block.file]?.label || block.file}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">{block.file}</div>
                        </div>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => move(idx, -1)}
                            disabled={idx === 0}
                            className="w-8 h-8 inline-flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                            aria-label={translate('Move up')}
                          >
                            <span className="fi-rr-angle-up" />
                          </button>
                          <button
                            type="button"
                            onClick={() => move(idx, 1)}
                            disabled={idx === blocks.length - 1}
                            className="w-8 h-8 inline-flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                            aria-label={translate('Move down')}
                          >
                            <span className="fi-rr-angle-down" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeBlock(idx)}
                            className="w-8 h-8 inline-flex items-center justify-center rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50"
                            aria-label={translate('Remove')}
                          >
                            <span className="fi-rr-trash" />
                          </button>
                        </div>
                      </div>

                      {schema.length > 0 ? (
                        <div className="space-y-3">
                          {schema.map((f) => (
                            <div key={f.key}>
                              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                {f.label || f.key}
                              </label>
                              {f.type === 'textarea' ? (
                                <textarea
                                  rows="3"
                                  value={block.fields[f.key] ?? ''}
                                  onChange={(e) => updateField(idx, f.key, e.target.value)}
                                  className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                              ) : (
                                <input
                                  type={f.type === 'image' || f.type === 'url' ? 'url' : 'text'}
                                  value={block.fields[f.key] ?? ''}
                                  onChange={(e) => updateField(idx, f.key, e.target.value)}
                                  className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500">
                          {translate('This block has no editable fields.')}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-100 rounded-lg p-4 lg:sticky lg:top-4">
            <h5 className="text-sm font-semibold text-gray-900 mb-3">{translate('Add a section')}</h5>
            {catalog.length === 0 ? (
              <p className="text-xs text-gray-500">{translate('No blocks available')}</p>
            ) : (
              <div className="flex flex-col gap-2">
                {catalog.map((b) => (
                  <button
                    key={b.file}
                    type="button"
                    onClick={() => addBlock(b.file)}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 text-left"
                  >
                    <span className="fi-rr-plus" />
                    <span>{b.label || b.file}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
