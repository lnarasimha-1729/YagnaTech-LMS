/**
 * AdminBlogCategories — port of admin/blog_category/index + create + edit blade files.
 * Card grid of blog categories with modal add/edit (title + subtitle, 80 char max) and delete confirm.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import NoData from '@/components/common/NoData';
import ConfirmModal from '@/components/common/ConfirmModal';
import Modal from '@/components/common/Modal';
import { useApi } from '@/hooks/useApi';
import { useSettings } from '@/contexts/SettingsContext';
import { API } from '@/config/routes';

const inputClass =
  'w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent';
const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5';

export default function AdminBlogCategories() {
  const { translate } = useSettings();
  const { get, post, put, del } = useApi();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, editing: null });
  const [confirm, setConfirm] = useState({ open: false, id: null });
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm({
    defaultValues: { title: '', subtitle: '' },
  });

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await get(API.ADMIN_BLOG_CATEGORIES);
      setCategories(res.data || res || []);
    } catch {
      toast.error(translate('Failed to load categories'));
    } finally {
      setLoading(false);
    }
  }, [get, translate]);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpenMenuId(null);
    };
    if (openMenuId != null) document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [openMenuId]);

  const openCreate = () => {
    reset({ title: '', subtitle: '' });
    setModal({ open: true, editing: null });
  };

  const openEdit = (cat) => {
    reset({ title: cat.title || '', subtitle: cat.subtitle || '' });
    setModal({ open: true, editing: cat });
    setOpenMenuId(null);
  };

  const closeModal = () => setModal({ open: false, editing: null });

  const onSubmit = async (values) => {
    try {
      if (modal.editing) {
        await put(API.ADMIN_BLOG_CATEGORY(modal.editing.id), values);
        toast.success(translate('Category updated'));
      } else {
        await post(API.ADMIN_BLOG_CATEGORIES, values);
        toast.success(translate('Category created'));
      }
      closeModal();
      fetchCategories();
    } catch (err) {
      toast.error(err?.response?.data?.message || translate('Failed to save'));
    }
  };

  const handleDelete = async () => {
    if (!confirm.id) return;
    try {
      await del(API.ADMIN_BLOG_CATEGORY(confirm.id));
      toast.success(translate('Category deleted'));
      fetchCategories();
    } catch {
      toast.error(translate('Failed to delete'));
    } finally {
      setConfirm({ open: false, id: null });
    }
  };

  return (
    <>
      <div className="bg-white border border-gray-100 rounded-lg mb-4">
        <div className="flex items-center justify-between px-5 py-3 flex-wrap gap-3">
          <h4 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <i className="fi-rr-settings-sliders" />
            <span>{translate('Blog Category')}</span>
          </h4>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <span className="fi-rr-plus" />
            <span>{translate('Add new category')}</span>
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : categories.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-lg p-6"><NoData /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="bg-white border border-gray-100 rounded-lg hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between px-5 py-3 gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 truncate" title={cat.title}>
                    {cat.title}
                  </p>
                  {cat.subtitle && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2" title={cat.subtitle}>
                      {cat.subtitle}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    {translate('Total number of blog')} {cat.blogs_count ?? 0}
                  </p>
                </div>
                <div className="relative" ref={openMenuId === cat.id ? menuRef : null}>
                  <button
                    type="button"
                    className="w-8 h-8 inline-flex items-center justify-center rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200"
                    onClick={() => setOpenMenuId(openMenuId === cat.id ? null : cat.id)}
                  >
                    <span className="fi-rr-menu-dots-vertical" />
                  </button>
                  {openMenuId === cat.id && (
                    <ul className="absolute right-0 mt-2 w-32 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-30">
                      <li>
                        <button
                          type="button"
                          className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => openEdit(cat)}
                        >
                          {translate('Edit')}
                        </button>
                      </li>
                      <li>
                        <button
                          type="button"
                          className="w-full text-left px-3 py-1.5 text-sm text-rose-600 hover:bg-rose-50"
                          onClick={() => {
                            setOpenMenuId(null);
                            setConfirm({ open: true, id: cat.id });
                          }}
                        >
                          {translate('Delete')}
                        </button>
                      </li>
                    </ul>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={modal.open}
        onClose={closeModal}
        title={modal.editing ? translate('Edit Category') : translate('Add Category')}
        footer={null}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className={labelClass} htmlFor="blog-cat-title">
              {translate('Title')} <span className="text-rose-500">*</span>
            </label>
            <input
              id="blog-cat-title"
              type="text"
              className={inputClass}
              {...register('title', { required: true })}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="blog-cat-subtitle">
              {translate('Subtitle')}{' '}
              <span className="text-xs text-gray-400">{translate('(80 Character)')}</span>
            </label>
            <textarea
              id="blog-cat-subtitle"
              rows={3}
              maxLength={80}
              className={inputClass}
              {...register('subtitle')}
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              {translate('Cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {isSubmitting
                ? translate('Saving...')
                : modal.editing
                  ? translate('Update category')
                  : translate('Add category')}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={confirm.open}
        onClose={() => setConfirm({ open: false, id: null })}
        onConfirm={handleDelete}
        title={translate('Delete this category?')}
        message={translate("You can't bring it back!")}
      />
    </>
  );
}
