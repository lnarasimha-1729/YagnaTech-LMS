/**
 * AdminArticles - CRUD for articles (topics) within a knowledge-base category.
 *
 * ============================================================================
 * ORIGINAL BLADE:
 *   resources/views/admin/articles/index.blade.php
 *   resources/views/admin/articles/create.blade.php
 *   resources/views/admin/articles/edit.blade.php
 * ============================================================================
 *
 * Accordion list of articles. Each row has topic_name + description body.
 * Modal for create/edit (topic_name + rich-text description).
 */

import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import NoData from '@/components/common/NoData';
import Pagination from '@/components/common/Pagination';
import ConfirmModal from '@/components/common/ConfirmModal';
import { useApi } from '@/hooks/useApi';
import { useSettings } from '@/contexts/SettingsContext';

export default function AdminArticles() {
  const { kbId } = useParams();
  const { translate } = useSettings();
  const { get, post, del } = useApi();

  const [loading, setLoading] = useState(true);
  const [kbTitle, setKbTitle] = useState('');
  const [articles, setArticles] = useState([]);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState({});
  const [modal, setModal] = useState(null); // { id?, topic_name, description }
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await get(`/api/admin/knowledge-base/${kbId}/articles?page=${page}`);
      const data = res.data || res;
      setKbTitle(data.title || data.knowledge_base?.title || '');
      const list = data.data || data.articles || data.items || [];
      setArticles(list);
      setPagination({
        current_page: data.current_page || 1,
        last_page: data.last_page || 1,
        total: data.total || 0,
      });
    } catch {
      toast.error(translate('Failed to load articles'));
    } finally {
      setLoading(false);
    }
  }, [get, kbId, page, translate]);

  useEffect(() => { fetchArticles(); }, [fetchArticles]);

  const toggle = (id) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const saveArticle = async () => {
    if (!modal.topic_name.trim()) {
      toast.error(translate('Topic name is required'));
      return;
    }
    setSaving(true);
    try {
      const payload = {
        knowledge_base_id: kbId,
        topic_name: modal.topic_name,
        description: modal.description,
      };
      if (modal.id) {
        payload._method = 'PUT';
        await post(`/api/admin/articles/${modal.id}`, payload);
      } else {
        await post(`/api/admin/knowledge-base/${kbId}/articles`, payload);
      }
      toast.success(translate(modal.id ? 'Article updated' : 'Article added'));
      setModal(null);
      fetchArticles();
    } catch {
      toast.error(translate('Failed to save'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await del(`/api/admin/articles/${id}`);
      toast.success(translate('Deleted'));
      fetchArticles();
    } catch {
      toast.error(translate('Failed to delete'));
    } finally {
      setConfirm(null);
    }
  };

  return (
    <>
      <div className="ol-card radius-8px">
        <div className="ol-card-body py-12px px-20px my-3">
          <div className="flex items-center justify-between flex-md-nowrap flex-wrap gap-3">
            <h4 className="title text-base">
              <i className="fi-rr-settings-sliders mr-2" />
              {kbTitle || translate('Articles')}
            </h4>
            <div className="flex gap-2">
              <button
                className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors border border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center cg-10px"
                type="button"
                onClick={() => setModal({ topic_name: '', description: '' })}
              >
                <span className="fi-rr-plus" />
                <span>{translate('Add Article')}</span>
              </button>
              <Link className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors border border-gray-300 text-gray-700 hover:bg-gray-50" to="/admin/knowledge-base">
                <span className="fi-rr-arrow-alt-left mr-2" />
                {translate('Back')}
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="ol-card p-20px">
        <div className="ol-card-body">
          {loading ? (
            <LoadingSpinner />
          ) : articles.length === 0 ? (
            <NoData />
          ) : (
            <ul className="ol-my-accordion list-none">
              {articles.map((article, i) => {
                const isOpen = expanded[article.id];
                return (
                  <li key={article.id} className="single-accor-item mb-2">
                    <div
                      className="accordion-btn-wrap flex items-center justify-between p-3 border rounded"
                      style={{ cursor: 'pointer' }}
                      onClick={() => toggle(article.id)}
                    >
                      <h3 className="title mb-0 text-sm">
                        {i + 1}. {article.topic_name}
                      </h3>
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors text-sm bg-gray-100 text-gray-700 hover:bg-gray-200"
                          type="button"
                          onClick={() => setModal({
                            id: article.id,
                            topic_name: article.topic_name,
                            description: article.description || '',
                          })}
                          title={translate('Edit')}
                        >
                          <span className="fi fi-rr-pen-clip" />
                        </button>
                        <button
                          className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors text-sm bg-gray-100 text-gray-700 hover:bg-gray-200"
                          type="button"
                          onClick={() => setConfirm({ id: article.id })}
                          title={translate('Delete')}
                        >
                          <span className="fi-rr-trash" />
                        </button>
                      </div>
                    </div>
                    {isOpen && (
                      <div className="accoritem-body p-3 border border-top-0 rounded-bottom">
                        <div dangerouslySetInnerHTML={{ __html: article.description || '' }} />
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          {pagination.last_page > 1 && (
            <Pagination currentPage={pagination.current_page} lastPage={pagination.last_page} onPageChange={setPage} />
          )}
        </div>
      </div>

      {modal && (
        <div className="modal fade show block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={(e) => e.target === e.currentTarget && setModal(null)}>
          <div className="mx-auto modal-lg flex items-center justify-center">
            <div className="bg-white rounded-2xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h5 className="text-base font-semibold text-gray-900">{translate(modal.id ? 'Edit Article' : 'Add Article')}</h5>
                <button type="button" className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100" onClick={() => setModal(null)} />
              </div>
              <div className="px-6 py-4">
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 block text-sm font-medium text-gray-700 mb-1.5">
                    {translate('Topic name')} <span className="text-red-600">*</span>
                  </label>
                  <input
                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    type="text"
                    required
                    autoFocus
                    value={modal.topic_name}
                    onChange={(e) => setModal({ ...modal, topic_name: e.target.value })}
                  />
                </div>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 block text-sm font-medium text-gray-700 mb-1.5">{translate('Description')}</label>
                  <textarea
                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    rows="8"
                    value={modal.description}
                    onChange={(e) => setModal({ ...modal, description: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100">
                <button type="button" className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-gray-500 text-white hover:bg-gray-600" onClick={() => setModal(null)}>{translate('Cancel')}</button>
                <button type="button" className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-indigo-600 text-white hover:bg-indigo-700" onClick={saveArticle} disabled={saving}>
                  {saving ? translate('Saving...') : translate('Submit')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirm && (
        <ConfirmModal message={translate('Delete this article?')} onConfirm={() => handleDelete(confirm.id)} onCancel={() => setConfirm(null)} />
      )}
    </>
  );
}
