import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { FaPen, FaTrash } from 'react-icons/fa';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import CategoryForm from './CategoryForm';
import { listCategories, storeCategory, updateCategory, deleteCategory } from '../../api/category';

const API = import.meta.env.VITE_ADMIN_API_URL || 'http://localhost:4000';
const imgUrl = (p) => (p ? `${API}/${p}` : 'https://placehold.co/400x240?text=No+Image');

export default function CategoryIndex() {
    const [categories, setCategories] = useState([]);
    const [modal, setModal] = useState(null);
    const [confirm, setConfirm] = useState(null);

    const load = async () => {
        const { categories } = await listCategories();
        setCategories(categories);
    };

    useEffect(() => { load(); }, []);

    const handleStore = async (fd) => {
        try { await storeCategory(fd); toast.success('Category added successfully'); setModal(null); load(); }
        catch (e) { toast.error(e.response?.data?.error || 'Failed'); }
    };

    const handleUpdate = async (id, fd) => {
        try { await updateCategory(id, fd); toast.success('Category updated successfully'); setModal(null); load(); }
        catch (e) { toast.error(e.response?.data?.error || 'Failed'); }
    };

    const handleDelete = async (id) => {
        try { await deleteCategory(id); toast.success('Category deleted successfully'); setConfirm(null); load(); }
        catch (e) { toast.error(e.response?.data?.error || 'Failed'); }
    };

    return (
        <div>
            <div className="ol-card rounded-ol-8 mb-3">
                <div className="ol-card-body py-12px px-20px my-3">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <h4 className="text-[16px] font-semibold text-dark m-0 flex items-center gap-2">
                            <i className="fi-rr-settings-sliders" />
                            All Category <span className="text-muted font-normal">({categories.length})</span>
                        </h4>
                        <button className="ol-btn-outline-secondary flex items-center gap-10px" onClick={() => setModal({ type: 'create', parentId: null })}>
                            <span className="fi-rr-plus" />
                            <span>Add new category</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {categories.map((cat) => (
                    <div key={cat.id} className="category-card ol-card rounded-ol-10 h-full">
                        <img className="card-img-top" src={imgUrl(cat.thumbnail)} alt="" />
                        <h6 className="text-[14px] font-semibold text-dark mb-12px flex items-center px-3 pt-3 m-0">
                            <i className={`${cat.icon} mr-1`} />
                            <span className="truncate">{cat.title}</span>
                            <span className="text-muted font-normal ml-2">({cat.childs?.length || 0})</span>
                            {/* Edit / Delete sit immediately after the title (and the child-count
                                pill) on the same row. Using react-icons/fa instead of the project's
                                "fi fi-rr-*" classes — those reference Flowbite Uicons which is not
                                imported anywhere, so every <i className="fi fi-rr-..."/> across the
                                admin renders an empty box. react-icons is already a dependency. */}
                            <span className="ml-auto inline-flex items-center gap-2">
                                <button
                                    type="button"
                                    className="text-gray hover:text-skin px-1"
                                    onClick={() => setModal({ type: 'edit', data: cat })}
                                    title="Edit category"
                                    aria-label={`Edit ${cat.title}`}
                                >
                                    <FaPen className="text-[13px]" />
                                </button>
                                <button
                                    type="button"
                                    className="text-gray hover:text-danger px-1"
                                    onClick={() => setConfirm(cat.id)}
                                    title="Delete category"
                                    aria-label={`Delete ${cat.title}`}
                                >
                                    <FaTrash className="text-[13px]" />
                                </button>
                            </span>
                        </h6>
                        <div className="ol-card-body py-0 px-0">
                            <ul className="divide-y divide-ebordermuted list-none m-0 p-0">
                                {cat.childs?.map((ch) => (
                                    <li key={ch.id} className="flex items-center px-4 py-2 text-gray text-[13px] group/li">
                                        <div className="flex items-center gap-2">
                                            <i className={ch.icon} />
                                            <span className="text-[12px]">{ch.title}</span>
                                        </div>
                                        <div className="subcategory-actions ml-auto items-center gap-2 hidden group-hover/li:inline-flex">
                                            <button className="text-gray hover:text-skin px-1 mx-1" onClick={() => setModal({ type: 'edit', data: ch })} title="Edit">
                                                <FaPen className="text-[12px]" />
                                            </button>
                                            <button className="text-gray hover:text-danger px-1 mx-1" onClick={() => setConfirm(ch.id)} title="Delete">
                                                <FaTrash className="text-[12px]" />
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                ))}
            </div>

            {modal?.type === 'create' && (
                <Modal title="Add new category" onClose={() => setModal(null)}>
                    <CategoryForm hiddenParentId={modal.parentId} onSubmit={handleStore} />
                </Modal>
            )}
            {modal?.type === 'edit' && (
                <Modal title="Edit category" onClose={() => setModal(null)}>
                    <CategoryForm
                        initial={modal.data}
                        parents={categories.filter((c) => c.id !== modal.data.id)}
                        onSubmit={(fd) => handleUpdate(modal.data.id, fd)}
                    />
                </Modal>
            )}
            {confirm && (
                <ConfirmDialog
                    message="Delete this category?"
                    onCancel={() => setConfirm(null)}
                    onConfirm={() => handleDelete(confirm)}
                />
            )}
        </div>
    );
}
