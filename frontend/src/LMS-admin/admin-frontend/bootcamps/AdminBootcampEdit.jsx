/**
 * AdminBootcampEdit — 1:1 port of admin/bootcamp/edit.blade.php and its tab partials.
 * Six tabs: curriculum, basic, pricing, info, media, seo. Tab state is driven by ?tab= query.
 * Save posts to ADMIN_BOOTCAMP_UPDATE with a `tab` discriminator matching the backend switch.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useFieldArray, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Modal from '@/components/common/Modal';
import ConfirmModal from '@/components/common/ConfirmModal';
import BootcampModuleForm from './curriculum/BootcampModuleForm';
import BootcampLiveClassForm from './curriculum/BootcampLiveClassForm';
import BootcampSortList from './curriculum/BootcampSortList';
import BootcampResources from './curriculum/BootcampResources';
import { useApi } from '@/hooks/useApi';
import { useSettings } from '@/contexts/SettingsContext';
import { API, ROUTES } from '@/config/routes';

const inputClass =
  'w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent';
const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5';

const TABS = [
  { key: 'curriculum', label: 'Curriculum', icon: 'fi-rr-edit' },
  { key: 'basic', label: 'Basic', icon: 'fi-rr-duplicate' },
  { key: 'pricing', label: 'Pricing', icon: 'fi-rr-comment-dollar' },
  { key: 'info', label: 'Info', icon: 'fi-rr-tags' },
  { key: 'media', label: 'Media', icon: 'fi fi-rr-gallery' },
  { key: 'seo', label: 'SEO', icon: 'fi-rr-note-medical' },
];

function toDateInput(value) {
  if (!value) return '';
  const n = Number(value);
  const d = Number.isFinite(n) && n > 1e9 ? new Date(n * 1000) : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

function parseList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const p = JSON.parse(value);
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
}

export default function AdminBootcampEdit() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { translate, getImage, getSetting } = useSettings();
  const currencySymbol = getSetting('currency_symbol') || '';
  const { get, post } = useApi();

  const activeTab = searchParams.get('tab') || 'basic';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bootcamp, setBootcamp] = useState(null);
  const [categories, setCategories] = useState([]);
  const [modules, setModules] = useState([]);
  const [seo, setSeo] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [ogImagePreview, setOgImagePreview] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [detail, cats] = await Promise.all([
        get(API.ADMIN_BOOTCAMP(id)),
        get(API.ADMIN_BOOTCAMP_CATEGORIES),
      ]);
      const b = detail?.data || detail;
      setBootcamp(b?.bootcamp || b);
      setModules(b?.modules || []);
      setSeo(b?.seo || null);
      setCategories(cats?.data || cats || []);
    } catch {
      toast.error(translate('Failed to load bootcamp'));
    } finally {
      setLoading(false);
    }
  }, [get, id, translate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const switchTab = (key) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', key);
    setSearchParams(next);
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-4">
      {/* Page header */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h4 className="flex items-center gap-3 text-base font-semibold text-gray-900">
            <span className="px-3 py-1 text-xs font-medium rounded bg-emerald-50 text-emerald-700 border border-emerald-100">
              {translate('Editing')}
            </span>
            <span className="truncate">{bootcamp?.title || '—'}</span>
          </h4>
          <div className="flex items-center gap-2 ml-auto">
            <Link
              to={ROUTES.ADMIN_BOOTCAMPS}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <i className="fi-rr-arrow-left" />
              <span>{translate('Back')}</span>
            </Link>
          </div>
        </div>
      </div>

      {loading || !bootcamp ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-5">
            {/* Sidebar */}
            <nav className="flex md:flex-col flex-wrap gap-1">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => switchTab(t.key)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-left w-full ${
                    activeTab === t.key
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                      : 'text-gray-700 hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  <i className={t.icon} />
                  <span>{translate(t.label)}</span>
                </button>
              ))}
            </nav>

            {/* Panel */}
            <div>
              {activeTab === 'curriculum' && (
                <CurriculumTab
                  bootcampId={id}
                  modules={modules}
                  translate={translate}
                  onChanged={fetchData}
                />
              )}
              {activeTab === 'basic' && (
                <BasicTab
                  bootcamp={bootcamp}
                  categories={categories}
                  saving={saving}
                  setSaving={setSaving}
                  onSaved={fetchData}
                  translate={translate}
                  post={post}
                  id={id}
                />
              )}
              {activeTab === 'pricing' && (
                <PricingTab
                  bootcamp={bootcamp}
                  saving={saving}
                  setSaving={setSaving}
                  onSaved={fetchData}
                  translate={translate}
                  currencySymbol={currencySymbol}
                  post={post}
                  id={id}
                />
              )}
              {activeTab === 'info' && (
                <InfoTab
                  bootcamp={bootcamp}
                  saving={saving}
                  setSaving={setSaving}
                  onSaved={fetchData}
                  translate={translate}
                  post={post}
                  id={id}
                />
              )}
              {activeTab === 'media' && (
                <MediaTab
                  bootcamp={bootcamp}
                  saving={saving}
                  setSaving={setSaving}
                  onSaved={fetchData}
                  translate={translate}
                  getImage={getImage}
                  thumbnailPreview={thumbnailPreview}
                  setThumbnailPreview={setThumbnailPreview}
                  post={post}
                  id={id}
                />
              )}
              {activeTab === 'seo' && (
                <SeoTab
                  seo={seo}
                  saving={saving}
                  setSaving={setSaving}
                  onSaved={fetchData}
                  translate={translate}
                  getImage={getImage}
                  ogImagePreview={ogImagePreview}
                  setOgImagePreview={setOgImagePreview}
                  post={post}
                  id={id}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ======================== Curriculum (full CRUD) ======================== */
function CurriculumTab({ bootcampId, modules, translate, onChanged }) {
  const { del } = useApi();

  const [expanded, setExpanded] = useState(() => new Set());
  const [moduleModal, setModuleModal] = useState({ open: false, module: null });
  const [liveClassModal, setLiveClassModal] = useState({ open: false, liveClass: null, defaultModuleId: null });
  const [sortModal, setSortModal] = useState({ open: false, kind: null, items: [], payload: {} });
  const [resourceModal, setResourceModal] = useState({ open: false, moduleId: null });
  const [confirm, setConfirm] = useState({ open: false });

  const toggle = (mid) => {
    setExpanded((s) => {
      const n = new Set(s);
      if (n.has(mid)) n.delete(mid); else n.add(mid);
      return n;
    });
  };

  const deleteModule = async (mid) => {
    try {
      await del(API.ADMIN_BOOTCAMP_MODULE(mid));
      toast.success(translate('Module deleted'));
      onChanged();
    } catch {
      toast.error(translate('Failed to delete module'));
    } finally {
      setConfirm({ open: false });
    }
  };

  const deleteLiveClass = async (cid) => {
    try {
      await del(API.ADMIN_BOOTCAMP_LIVE_CLASS(cid));
      toast.success(translate('Class deleted'));
      onChanged();
    } catch {
      toast.error(translate('Failed to delete class'));
    } finally {
      setConfirm({ open: false });
    }
  };

  const hasModules = modules && modules.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
          onClick={() => setModuleModal({ open: true, module: null })}
        >
          <i className="fi-rr-plus" /> {translate('Add module')}
        </button>
        {hasModules && (
          <>
            <button
              type="button"
              className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
              onClick={() => setLiveClassModal({ open: true, liveClass: null, defaultModuleId: modules[0]?.id || null })}
            >
              <i className="fi-rr-plus" /> {translate('Add live class')}
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
              onClick={() =>
                setSortModal({
                  open: true,
                  kind: 'module',
                  items: modules.map((m) => ({ id: m.id, title: m.title })),
                  payload: { bootcamp_id: bootcampId },
                })
              }
            >
              <i className="fi-rr-apps-sort" /> {translate('Sort Module')}
            </button>
          </>
        )}
      </div>

      {!hasModules ? (
        <div className="border border-dashed border-gray-200 rounded-xl p-8 text-center text-gray-500">
          <p className="text-sm">{translate('No modules have been added yet.')}</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {modules.map((m, idx) => {
            const isOpen = expanded.has(m.id);
            const classes = m.live_classes || m.liveClasses || [];
            return (
              <li key={m.id} className="border border-gray-100 rounded-lg">
                <div className="flex items-center justify-between px-3 py-3">
                  <button
                    type="button"
                    onClick={() => toggle(m.id)}
                    className="flex-1 flex items-center gap-2 text-left"
                  >
                    <i className={`fi-rr-angle-${isOpen ? 'up' : 'down'} text-gray-500`} />
                    <span className="text-sm font-semibold text-gray-900">
                      {idx + 1}. {m.title}
                    </span>
                    {Number(m.restriction) === 1 && m.publish_date && (
                      <small className="text-xs text-gray-500 ml-2">
                        {translate('Available from:')} {formatUnix(m.publish_date)}
                      </small>
                    )}
                    {Number(m.restriction) === 2 && m.publish_date && m.expiry_date && (
                      <small className="text-xs text-gray-500 ml-2">
                        {translate('Available within:')} {formatUnix(m.publish_date)} – {formatUnix(m.expiry_date)}
                      </small>
                    )}
                  </button>
                  <div className="flex items-center gap-1 ml-2">
                    {classes.length > 0 && (
                      <button
                        type="button"
                        className="w-8 h-8 rounded-lg hover:bg-gray-100 text-gray-600 inline-flex items-center justify-center"
                        title={translate('Sort class')}
                        onClick={() =>
                          setSortModal({
                            open: true,
                            kind: 'liveClass',
                            items: classes.map((c) => ({ id: c.id, title: c.title })),
                            payload: { module_id: m.id },
                          })
                        }
                      >
                        <i className="fi-rr-apps-sort" />
                      </button>
                    )}
                    <button
                      type="button"
                      className="w-8 h-8 rounded-lg hover:bg-gray-100 text-gray-600 inline-flex items-center justify-center"
                      title={translate('Resources')}
                      onClick={() => setResourceModal({ open: true, moduleId: m.id })}
                    >
                      <i className="fi fi-rr-box-open-full" />
                    </button>
                    <button
                      type="button"
                      className="w-8 h-8 rounded-lg hover:bg-gray-100 text-gray-600 inline-flex items-center justify-center"
                      title={translate('Edit module')}
                      onClick={() => setModuleModal({ open: true, module: m })}
                    >
                      <i className="fi-rr-pencil" />
                    </button>
                    <button
                      type="button"
                      className="w-8 h-8 rounded-lg hover:bg-rose-50 hover:text-rose-600 text-gray-600 inline-flex items-center justify-center"
                      title={translate('Delete module')}
                      onClick={() => setConfirm({ open: true, onConfirm: () => deleteModule(m.id) })}
                    >
                      <i className="fi-rr-trash" />
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <ul className="border-t border-gray-100 divide-y divide-gray-100">
                    {classes.length === 0 ? (
                      <li className="px-4 py-3 text-sm text-gray-500">
                        {translate('No live classes are available.')}
                      </li>
                    ) : (
                      classes.map((c) => (
                        <li key={c.id} className="px-4 py-3 flex items-center justify-between text-sm">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-800 truncate">{c.title}</span>
                              {c.status && (
                                <span
                                  className={`text-xs font-medium px-2 py-0.5 rounded text-white ${
                                    c.status === 'live'
                                      ? 'bg-rose-500'
                                      : c.status === 'upcoming'
                                      ? 'bg-amber-500'
                                      : 'bg-emerald-600'
                                  }`}
                                >
                                  {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                                </span>
                              )}
                            </div>
                            <small className="text-xs text-gray-500">
                              {c.start_time && formatUnix(c.start_time, true)}
                              {c.start_time && c.end_time && ' – '}
                              {c.end_time && formatUnixTime(c.end_time)}
                            </small>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              className="w-8 h-8 rounded-lg hover:bg-gray-100 text-gray-600 inline-flex items-center justify-center"
                              title={translate('Edit class')}
                              onClick={() => setLiveClassModal({ open: true, liveClass: c, defaultModuleId: m.id })}
                            >
                              <i className="fi-rr-pencil" />
                            </button>
                            <button
                              type="button"
                              className="w-8 h-8 rounded-lg hover:bg-rose-50 hover:text-rose-600 text-gray-600 inline-flex items-center justify-center"
                              title={translate('Delete class')}
                              onClick={() => setConfirm({ open: true, onConfirm: () => deleteLiveClass(c.id) })}
                            >
                              <i className="fi-rr-trash" />
                            </button>
                          </div>
                        </li>
                      ))
                    )}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* Module modal */}
      <Modal
        isOpen={moduleModal.open}
        onClose={() => setModuleModal({ open: false, module: null })}
        title={moduleModal.module ? translate('Edit module') : translate('Add new module')}
        size="md"
        footer={null}
      >
        <BootcampModuleForm
          bootcampId={bootcampId}
          module={moduleModal.module}
          onSuccess={() => { setModuleModal({ open: false, module: null }); onChanged(); }}
          onCancel={() => setModuleModal({ open: false, module: null })}
        />
      </Modal>

      {/* Live class modal */}
      <Modal
        isOpen={liveClassModal.open}
        onClose={() => setLiveClassModal({ open: false, liveClass: null, defaultModuleId: null })}
        title={liveClassModal.liveClass ? translate('Edit class') : translate('Add live class')}
        size="lg"
        footer={null}
      >
        <BootcampLiveClassForm
          modules={modules.map((m) => ({ id: m.id, title: m.title }))}
          liveClass={liveClassModal.liveClass}
          defaultModuleId={liveClassModal.defaultModuleId}
          onSuccess={() => { setLiveClassModal({ open: false, liveClass: null, defaultModuleId: null }); onChanged(); }}
          onCancel={() => setLiveClassModal({ open: false, liveClass: null, defaultModuleId: null })}
        />
      </Modal>

      {/* Sort modal (module or live-class) */}
      <Modal
        isOpen={sortModal.open}
        onClose={() => setSortModal({ open: false, kind: null, items: [], payload: {} })}
        title={sortModal.kind === 'module' ? translate('Sort module') : translate('Sort lessons')}
        size="md"
        footer={null}
      >
        <BootcampSortList
          items={sortModal.items}
          sortUrl={
            sortModal.kind === 'module'
              ? API.ADMIN_BOOTCAMP_MODULES_SORT
              : API.ADMIN_BOOTCAMP_LIVE_CLASSES_SORT
          }
          extraPayload={sortModal.payload}
          onSuccess={() => { setSortModal({ open: false, kind: null, items: [], payload: {} }); onChanged(); }}
          onCancel={() => setSortModal({ open: false, kind: null, items: [], payload: {} })}
        />
      </Modal>

      {/* Resources modal */}
      <Modal
        isOpen={resourceModal.open}
        onClose={() => setResourceModal({ open: false, moduleId: null })}
        title={translate('Resources')}
        size="lg"
        footer={null}
      >
        {resourceModal.moduleId && (
          <BootcampResources
            moduleId={resourceModal.moduleId}
            onClose={() => setResourceModal({ open: false, moduleId: null })}
          />
        )}
      </Modal>

      <ConfirmModal
        isOpen={confirm.open}
        onClose={() => setConfirm({ open: false })}
        onConfirm={confirm.onConfirm}
      />
    </div>
  );
}

function formatUnix(ts, withTime = false) {
  if (!ts) return '';
  const d = new Date(Number(ts) * 1000);
  if (Number.isNaN(d.getTime())) return '';
  const base = d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
  if (!withTime) return base;
  return `${base} ${d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;
}

function formatUnixTime(ts) {
  if (!ts) return '';
  const d = new Date(Number(ts) * 1000);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

/* ============================== Basic tab ============================== */
function BasicTab({ bootcamp, categories, saving, setSaving, onSaved, translate, post, id }) {
  const { register, handleSubmit } = useForm({
    defaultValues: {
      title: bootcamp.title || '',
      short_description: bootcamp.short_description || '',
      description: bootcamp.description || '',
      category_id: bootcamp.category_id || '',
      publish_date: toDateInput(bootcamp.publish_date),
    },
  });

  const onSubmit = async (values) => {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('tab', 'basic');
      fd.append('title', values.title);
      fd.append('short_description', values.short_description || '');
      fd.append('description', values.description || '');
      fd.append('category_id', values.category_id);
      fd.append('publish_date', values.publish_date);
      await post(API.ADMIN_BOOTCAMP_UPDATE(id), fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success(translate('Changes saved'));
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || translate('Failed to save'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className={labelClass}>{translate('Bootcamp title')}<span className="text-rose-500 ml-1">*</span></label>
        <input type="text" className={inputClass} {...register('title', { required: true })} />
      </div>
      <div>
        <label className={labelClass}>{translate('Short description')}</label>
        <textarea rows={3} className={inputClass} {...register('short_description')} />
      </div>
      <div>
        <label className={labelClass}>{translate('Description')}</label>
        <textarea rows={6} className={inputClass} {...register('description')} />
      </div>
      <div>
        <label className={labelClass}>{translate('Category')}<span className="text-rose-500 ml-1">*</span></label>
        <select className={inputClass} {...register('category_id', { required: true })}>
          <option value="">{translate('Select a category')}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelClass}>{translate('Publish Date')}<span className="text-rose-500 ml-1">*</span></label>
        <input type="date" className={inputClass} {...register('publish_date', { required: true })} />
      </div>
      <SaveRow saving={saving} translate={translate} />
    </form>
  );
}

/* ============================== Pricing tab ============================== */
function PricingTab({ bootcamp, saving, setSaving, onSaved, translate, currencySymbol, post, id }) {
  const { register, handleSubmit, watch } = useForm({
    defaultValues: {
      is_paid: String(bootcamp.is_paid ?? '1'),
      price: bootcamp.price ?? '',
      discount_flag: Number(bootcamp.discount_flag) === 1,
      discounted_price: bootcamp.discounted_price ?? '',
    },
  });
  const isPaid = watch('is_paid');
  const discountFlag = watch('discount_flag');

  const onSubmit = async (values) => {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('tab', 'pricing');
      fd.append('is_paid', values.is_paid);
      fd.append('price', values.is_paid === '1' ? (values.price || '') : '');
      fd.append('discount_flag', values.discount_flag ? '1' : '0');
      fd.append('discounted_price', values.discount_flag ? (values.discounted_price || '') : '');
      await post(API.ADMIN_BOOTCAMP_UPDATE(id), fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success(translate('Changes saved'));
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || translate('Failed to save'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className={labelClass}>{translate('Pricing type')}<span className="text-rose-500 ml-1">*</span></label>
        <div className="flex items-center gap-4">
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input type="radio" value="1" className="w-4 h-4 text-emerald-600 focus:ring-emerald-500" {...register('is_paid')} />
            {translate('Paid')}
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input type="radio" value="0" className="w-4 h-4 text-emerald-600 focus:ring-emerald-500" {...register('is_paid')} />
            {translate('Free')}
          </label>
        </div>
      </div>

      {isPaid === '1' && (
        <div className="space-y-4 border border-gray-100 rounded-lg p-3 bg-gray-50">
          <div>
            <label className={labelClass}>
              {translate('Price')} <small className="text-gray-500">({currencySymbol || ''})</small>
              <span className="text-rose-500 ml-1">*</span>
            </label>
            <input type="number" min="1" step="0.01" className={inputClass} {...register('price')} />
          </div>
          <div className="flex items-center gap-2">
            <input
              id="discount_flag"
              type="checkbox"
              className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              {...register('discount_flag')}
            />
            <label htmlFor="discount_flag" className="text-sm text-gray-700">
              {translate('Check if this bootcamp has discount')}
            </label>
          </div>
          {discountFlag && (
            <div>
              <label className={labelClass}>{translate('Discounted price')}</label>
              <input type="number" min="1" step="0.01" className={inputClass} {...register('discounted_price')} />
            </div>
          )}
        </div>
      )}

      <SaveRow saving={saving} translate={translate} />
    </form>
  );
}

/* ============================== Info tab ============================== */
function InfoTab({ bootcamp, saving, setSaving, onSaved, translate, post, id }) {
  const initialFaqs = useMemo(() => {
    const f = parseList(bootcamp.faqs);
    return f.length ? f : [{ title: '', description: '' }];
  }, [bootcamp.faqs]);
  const initialRequirements = useMemo(() => {
    const r = parseList(bootcamp.requirements);
    return (r.length ? r : ['']).map((v) => ({ value: v }));
  }, [bootcamp.requirements]);
  const initialOutcomes = useMemo(() => {
    const o = parseList(bootcamp.outcomes);
    return (o.length ? o : ['']).map((v) => ({ value: v }));
  }, [bootcamp.outcomes]);

  const { register, handleSubmit, control } = useForm({
    defaultValues: { faqs: initialFaqs, requirements: initialRequirements, outcomes: initialOutcomes },
  });
  const faqArr = useFieldArray({ control, name: 'faqs' });
  const reqArr = useFieldArray({ control, name: 'requirements' });
  const outArr = useFieldArray({ control, name: 'outcomes' });

  const onSubmit = async (values) => {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('tab', 'info');
      values.faqs.forEach((f) => {
        fd.append('faq_title[]', f.title || '');
        fd.append('faq_description[]', f.description || '');
      });
      values.requirements.forEach((r) => fd.append('requirements[]', r.value || ''));
      values.outcomes.forEach((o) => fd.append('outcomes[]', o.value || ''));
      await post(API.ADMIN_BOOTCAMP_UPDATE(id), fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success(translate('Changes saved'));
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || translate('Failed to save'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* FAQs */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <label className={labelClass}>{translate('Bootcamp FAQ')}</label>
          <button
            type="button"
            onClick={() => faqArr.append({ title: '', description: '' })}
            className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border border-gray-200 text-gray-700 hover:bg-gray-50"
          >
            <i className="fi-rr-plus-small" /> {translate('Add new')}
          </button>
        </div>
        <div className="space-y-3">
          {faqArr.fields.map((field, idx) => (
            <div key={field.id} className="flex gap-2">
              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  className={inputClass}
                  placeholder={translate('FAQ question')}
                  {...register(`faqs.${idx}.title`)}
                />
                <textarea
                  rows={2}
                  className={inputClass}
                  placeholder={translate('Answer')}
                  {...register(`faqs.${idx}.description`)}
                />
              </div>
              {faqArr.fields.length > 1 && (
                <button
                  type="button"
                  onClick={() => faqArr.remove(idx)}
                  className="h-9 w-9 rounded-lg border border-gray-200 text-gray-600 hover:bg-rose-50 hover:text-rose-600 inline-flex items-center justify-center"
                  title={translate('Remove')}
                >
                  <i className="fi-rr-minus-small" />
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Requirements */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <label className={labelClass}>{translate('Requirements')}</label>
          <button
            type="button"
            onClick={() => reqArr.append({ value: '' })}
            className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border border-gray-200 text-gray-700 hover:bg-gray-50"
          >
            <i className="fi-rr-plus-small" /> {translate('Add new')}
          </button>
        </div>
        <div className="space-y-2">
          {reqArr.fields.map((field, idx) => (
            <div key={field.id} className="flex gap-2">
              <input
                type="text"
                className={inputClass}
                placeholder={translate('Provide requirements')}
                {...register(`requirements.${idx}.value`)}
              />
              {reqArr.fields.length > 1 && (
                <button
                  type="button"
                  onClick={() => reqArr.remove(idx)}
                  className="h-9 w-9 rounded-lg border border-gray-200 text-gray-600 hover:bg-rose-50 hover:text-rose-600 inline-flex items-center justify-center"
                >
                  <i className="fi-rr-minus-small" />
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Outcomes */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <label className={labelClass}>{translate('Outcomes')}</label>
          <button
            type="button"
            onClick={() => outArr.append({ value: '' })}
            className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border border-gray-200 text-gray-700 hover:bg-gray-50"
          >
            <i className="fi-rr-plus-small" /> {translate('Add new')}
          </button>
        </div>
        <div className="space-y-2">
          {outArr.fields.map((field, idx) => (
            <div key={field.id} className="flex gap-2">
              <input
                type="text"
                className={inputClass}
                placeholder={translate('Provide outcomes')}
                {...register(`outcomes.${idx}.value`)}
              />
              {outArr.fields.length > 1 && (
                <button
                  type="button"
                  onClick={() => outArr.remove(idx)}
                  className="h-9 w-9 rounded-lg border border-gray-200 text-gray-600 hover:bg-rose-50 hover:text-rose-600 inline-flex items-center justify-center"
                >
                  <i className="fi-rr-minus-small" />
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      <SaveRow saving={saving} translate={translate} />
    </form>
  );
}

/* ============================== Media tab ============================== */
function MediaTab({ bootcamp, saving, setSaving, onSaved, translate, getImage, thumbnailPreview, setThumbnailPreview, post, id }) {
  const { register, handleSubmit } = useForm();

  const onThumbChange = (e) => {
    const file = e.target.files?.[0];
    setThumbnailPreview(file ? URL.createObjectURL(file) : null);
  };

  const onSubmit = async (values) => {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('tab', 'media');
      if (values.thumbnail?.[0]) fd.append('thumbnail', values.thumbnail[0]);
      await post(API.ADMIN_BOOTCAMP_UPDATE(id), fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success(translate('Changes saved'));
      setThumbnailPreview(null);
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || translate('Failed to save'));
    } finally {
      setSaving(false);
    }
  };

  const currentThumb = thumbnailPreview || (bootcamp.thumbnail ? getImage(bootcamp.thumbnail) : null);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className={labelClass}>{translate('Thumbnail')}</label>
        <input
          type="file"
          accept="image/*"
          className={inputClass}
          {...register('thumbnail', { onChange: onThumbChange })}
        />
        {currentThumb && (
          <div className="mt-3 rounded-lg overflow-hidden border border-gray-100 max-w-md">
            <img src={currentThumb} alt="" className="w-full h-60 object-cover" />
          </div>
        )}
      </div>
      <SaveRow saving={saving} translate={translate} />
    </form>
  );
}

/* ============================== SEO tab ============================== */
function SeoTab({ seo, saving, setSaving, onSaved, translate, getImage, ogImagePreview, setOgImagePreview, post, id }) {
  const { register, handleSubmit } = useForm({
    defaultValues: {
      meta_title: seo?.meta_title || '',
      meta_keywords: seo?.meta_keywords || '',
      meta_description: seo?.meta_description || '',
      meta_robot: seo?.meta_robot || '',
      canonical_url: seo?.canonical_url || '',
      custom_url: seo?.custom_url || '',
      og_title: seo?.og_title || '',
      og_description: seo?.og_description || '',
      json_ld: seo?.json_ld || '',
    },
  });

  const onOgChange = (e) => {
    const file = e.target.files?.[0];
    setOgImagePreview(file ? URL.createObjectURL(file) : null);
  };

  const onSubmit = async (values) => {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('tab', 'seo');
      Object.entries(values).forEach(([k, v]) => {
        if (k === 'og_image') {
          if (v?.[0]) fd.append('og_image', v[0]);
        } else {
          fd.append(k, v ?? '');
        }
      });
      if (seo?.og_image) fd.append('old_og_image', seo.og_image);
      await post(API.ADMIN_BOOTCAMP_UPDATE(id), fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success(translate('Changes saved'));
      setOgImagePreview(null);
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || translate('Failed to save'));
    } finally {
      setSaving(false);
    }
  };

  const currentOg = ogImagePreview || (seo?.og_image ? getImage(seo.og_image) : null);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className={labelClass}>{translate('Meta Title')}</label>
        <input type="text" className={inputClass} placeholder="Meta Title" {...register('meta_title')} />
      </div>
      <div>
        <label className={labelClass}>{translate('Meta Keywords')}</label>
        <input type="text" className={inputClass} placeholder="Meta keywords" {...register('meta_keywords')} />
        <small className="text-xs text-gray-500">{translate('Writing your keyword and hit the enter')}</small>
      </div>
      <div>
        <label className={labelClass}>{translate('Meta Description')}</label>
        <textarea rows={3} className={inputClass} placeholder="Meta Description" {...register('meta_description')} />
      </div>
      <div>
        <label className={labelClass}>{translate('Meta Robot')}</label>
        <input type="text" className={inputClass} placeholder="Meta Robot" {...register('meta_robot')} />
      </div>
      <div>
        <label className={labelClass}>{translate('Canonical Url')}</label>
        <input type="text" className={inputClass} placeholder="https://example.com/courses" {...register('canonical_url')} />
      </div>
      <div>
        <label className={labelClass}>{translate('Custom Url')}</label>
        <input type="text" className={inputClass} placeholder="https://example.com/dresses/courses" {...register('custom_url')} />
      </div>
      <div>
        <label className={labelClass}>{translate('Og Title')}</label>
        <input type="text" className={inputClass} {...register('og_title')} />
      </div>
      <div>
        <label className={labelClass}>{translate('Og Description')}</label>
        <textarea rows={3} className={inputClass} {...register('og_description')} />
      </div>
      <div>
        <label className={labelClass}>{translate('Og Image')}</label>
        {currentOg && (
          <div className="mb-2 rounded-lg overflow-hidden border border-gray-100 max-w-[180px]">
            <img src={currentOg} alt="" className="w-full h-28 object-cover" />
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          className={inputClass}
          {...register('og_image', { onChange: onOgChange })}
        />
      </div>
      <div>
        <label className={labelClass}>{translate('Json Id')}</label>
        <textarea rows={3} className={inputClass} {...register('json_ld')} />
      </div>
      <SaveRow saving={saving} translate={translate} />
    </form>
  );
}

/* ============================== Shared save row ============================== */
function SaveRow({ saving, translate }) {
  return (
    <div className="flex justify-end pt-4 border-t border-gray-100">
      <button
        type="submit"
        disabled={saving}
        className="px-5 py-2 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        {saving ? translate('Saving...') : translate('Save Changes')}
      </button>
    </div>
  );
}
