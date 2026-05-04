/**
 * AdminCategories — 1:1 port of resources/views/admin/category/index.blade.php
 * Parent cards with children list, add/edit/delete actions via modals.
 */

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Modal from '@/components/common/Modal';
import ConfirmModal from '@/components/common/ConfirmModal';
import NoData from '@/components/common/NoData';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import CategoryForm from './CategoryForm';
import { useApi } from '@/hooks/useApi';
import { useSettings } from '@/contexts/SettingsContext';
import { API } from '@/config/routes';

export default function AdminCategories() {
  const { translate, getImage } = useSettings();
  const { get, del } = useApi();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formModal, setFormModal] = useState({ open: false, category: null, parentId: null });
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null, deleting: false });

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await get(API.ADMIN_CATEGORIES);
      setCategories(Array.isArray(res) ? res : res?.data || []);
    } catch {
      toast.error(translate('Failed to load categories'));
    } finally {
      setLoading(false);
    }
  }, [get, translate]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const openCreate = (parentId = null) => setFormModal({ open: true, category: null, parentId });
  const openEdit = (category) => setFormModal({ open: true, category, parentId: null });
  const closeForm = () => setFormModal({ open: false, category: null, parentId: null });
  const onFormSuccess = () => { closeForm(); fetchCategories(); };

  const openDelete = (id) => setDeleteModal({ open: true, id, deleting: false });
  const closeDelete = () => setDeleteModal({ open: false, id: null, deleting: false });

  const confirmDelete = async () => {
    if (!deleteModal.id) return;
    setDeleteModal((m) => ({ ...m, deleting: true }));
    try {
      await del(API.ADMIN_CATEGORY(deleteModal.id));
      toast.success(translate('Category deleted successfully'));
      closeDelete();
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || translate('Failed to delete category'));
      setDeleteModal((m) => ({ ...m, deleting: false }));
    }
  };

  const parentCategories = categories
    .filter((c) => !formModal.category || c.id !== formModal.category.id)
    .map((c) => ({ id: c.id, title: c.title }));

  const totalCount = categories.length;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Page header */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h4 className="flex items-center gap-2 text-base font-semibold text-gray-900">
            <i className="fi-rr-settings-sliders text-emerald-600" />
            {translate('All Category')}{' '}
            <span className="text-gray-500 font-normal">({totalCount})</span>
          </h4>
          <button
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            onClick={() => openCreate(null)}
          >
            <i className="fi-rr-plus" />
            <span>{translate('Add new category')}</span>
          </button>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <LoadingSpinner />
      ) : categories.length === 0 ? (
        <NoData message={translate('No categories found')} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {categories.map((category) => (
            <div key={category.id} className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
              {category.thumbnail && (
                <img
                  className="w-full h-36 object-cover"
                  src={getImage(category.thumbnail)}
                  alt={category.title}
                />
              )}
              <h6 className="flex items-center gap-2 text-sm font-semibold text-gray-900 px-4 pt-3 pb-2">
                <i className={`${category.icon} text-emerald-600`} />
                <span className="truncate">{category.title}</span>
                <span className="ml-auto text-xs text-gray-500 font-normal">
                  ({category.childs?.length || 0})
                </span>
              </h6>

              <ul className="flex-1 border-t border-gray-100 divide-y divide-gray-100">
                {category.childs?.map((child) => (
                  <li key={child.id} className="px-4 py-2 flex items-center justify-between text-sm text-gray-600">
                    <span className="flex items-center gap-2 min-w-0">
                      <i className={`${child.icon} text-gray-400`} />
                      <span className="truncate">{child.title}</span>
                    </span>
                    <span className="flex items-center gap-1 text-gray-500">
                      <button
                        type="button"
                        className="w-7 h-7 rounded hover:bg-gray-100 hover:text-emerald-600 flex items-center justify-center"
                        title={translate('Edit')}
                        onClick={() => openEdit(child)}
                      >
                        <i className="fi fi-rr-pen-clip text-xs" />
                      </button>
                      <button
                        type="button"
                        className="w-7 h-7 rounded hover:bg-rose-50 hover:text-rose-600 flex items-center justify-center"
                        title={translate('Delete')}
                        onClick={() => openDelete(child.id)}
                      >
                        <i className="fi fi-rr-trash text-xs" />
                      </button>
                    </span>
                  </li>
                ))}
              </ul>

              <div className="border-t border-gray-100 px-2 py-2 flex items-center justify-around text-xs font-medium text-gray-700">
                <button
                  type="button"
                  className="flex items-center gap-1 px-2 py-1 hover:text-emerald-600"
                  onClick={() => openEdit(category)}
                >
                  <i className="fi fi-rr-pen-clip" />
                  <span>{translate('Edit')}</span>
                </button>
                <button
                  type="button"
                  className="flex items-center gap-1 px-2 py-1 hover:text-rose-600"
                  onClick={() => openDelete(category.id)}
                >
                  <i className="fi-rr-trash" />
                  <span>{translate('Delete')}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={formModal.open}
        onClose={closeForm}
        title={formModal.category ? translate('Edit category') : translate('Add new category')}
        size="md"
        footer={null}
      >
        <CategoryForm
          category={formModal.category}
          parentId={formModal.parentId}
          parentCategories={parentCategories}
          onSuccess={onFormSuccess}
        />
      </Modal>

      <ConfirmModal
        isOpen={deleteModal.open}
        onClose={closeDelete}
        onConfirm={confirmDelete}
        loading={deleteModal.deleting}
        title={translate('Are you sure?')}
        message={translate("You can't bring it back!")}
      />
    </div>
  );
}
