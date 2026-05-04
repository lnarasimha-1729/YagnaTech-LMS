/**
 * AdminBlogs - Admin blog management list.
 *
 * ============================================================================
 * ORIGINAL BLADE: resources/views/admin/blog/index.blade.php
 * ============================================================================
 *
 * Paginated table of blog posts with search, per-row actions (edit, delete),
 * and "Add new blog" button. Same data-table pattern as AdminCourses.
 */

import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import NoData from '@/components/common/NoData';
import ConfirmModal from '@/components/common/ConfirmModal';
import Pagination from '@/components/common/Pagination';
import { useApi } from '@/hooks/useApi';
import { useSettings } from '@/contexts/SettingsContext';
import { API, ROUTES, buildRoute } from '@/config/routes';

export default function AdminBlogs() {
  const { translate, getImage } = useSettings();
  const { get, del } = useApi();
  const [searchParams, setSearchParams] = useSearchParams();

  const [blogs, setBlogs] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmModal, setConfirmModal] = useState({ open: false });
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');

  const page = searchParams.get('page') || '1';
  const search = searchParams.get('search') || '';

  const fetchBlogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page };
      if (search) params.search = search;
      const res = await get(API.ADMIN_BLOGS, { params });
      setBlogs(res.data || []);
      setMeta(res.meta || null);
    } catch {
      toast.error(translate('Failed to load blogs'));
    } finally {
      setLoading(false);
    }
  }, [get, page, search, translate]);

  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  const updateFilter = (patch) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([k, v]) => {
      if (!v) next.delete(k);
      else next.set(k, v);
    });
    if (!('page' in patch)) next.delete('page');
    setSearchParams(next);
  };

  const onSearchSubmit = (e) => {
    e.preventDefault();
    updateFilter({ search: searchInput });
  };

  const handleDelete = async (id) => {
    try {
      await del(`${API.ADMIN_BLOGS}/${id}`);
      toast.success(translate('Blog deleted'));
      fetchBlogs();
    } catch {
      toast.error(translate('Failed to delete'));
    }
    setConfirmModal({ open: false });
  };

  return (
    <>
      {/* Header */}
      <div className="ol-card radius-8px">
        <div className="ol-card-body py-12px px-20px my-3">
          <div className="flex items-center justify-between flex-md-nowrap flex-wrap gap-3">
            <h4 className="title text-base">
              <i className="fi-rr-settings-sliders mr-2" />
              {translate('Blog')}
            </h4>
            <Link
              to={ROUTES.ADMIN_BLOG_CREATE}
              className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors border border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center cg-10px"
            >
              <span className="fi-rr-plus" />
              <span>{translate('Add new blog')}</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap -mx-3">
        <div className="w-full">
          <div className="ol-card">
            <div className="ol-card-body p-3">
              {/* Search */}
              <div className="flex flex-wrap -mx-3 mb-3 mt-3">
                <div className="w-full md:w-1/2" />
                <div className="w-full md:w-1/2">
                  <form onSubmit={onSearchSubmit}>
                    <div className="flex flex-wrap -mx-3">
                      <div className="col-9">
                        <input
                          className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          type="text"
                          value={searchInput}
                          onChange={(e) => setSearchInput(e.target.value)}
                          placeholder={translate('Search Title')}
                        />
                      </div>
                      <div className="w-1/4">
                        <button className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-indigo-600 text-white hover:bg-indigo-700 w-full" type="submit">
                          {translate('Search')}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>

              {/* Table */}
              {loading ? (
                <LoadingSpinner />
              ) : blogs.length === 0 ? (
                <NoData message={translate('No blog posts found')} />
              ) : (
                <>
                  <div className="overflow-x-auto overflow-auto">
                    <table className="eTable eTable-2 w-full">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>{translate('Title')}</th>
                          <th>{translate('Category')}</th>
                          <th>{translate('Author')}</th>
                          <th>{translate('Status')}</th>
                          <th>{translate('Date')}</th>
                          <th>{translate('Options')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {blogs.map((blog, idx) => (
                          <tr key={blog.id}>
                            <td>{(meta?.from || 1) + idx}</td>
                            <td>
                              <div className="dAdmin_profile flex items-center min-w-200px">
                                {blog.thumbnail && (
                                  <div className="dAdmin_profile_img mr-2">
                                    <img
                                      className="img-fluid rounded"
                                      src={getImage(blog.thumbnail)}
                                      width="60"
                                      height="40"
                                      alt=""
                                      style={{ objectFit: 'cover' }}
                                    />
                                  </div>
                                )}
                                <h4 className="title text-sm">{blog.title}</h4>
                              </div>
                            </td>
                            <td>
                              <span className="text-xs">{blog.category_title || '-'}</span>
                            </td>
                            <td>
                              <span className="text-xs">{blog.author_name || '-'}</span>
                            </td>
                            <td>
                              <span
                                className={`inline-block text-xs font-medium px-2 py-0.5 rounded bg-${blog.status === 'active' || blog.status === 1 ? 'success' : 'warning'}`}
                              >
                                {translate(blog.status === 'active' || blog.status === 1 ? 'Active' : 'Pending')}
                              </span>
                            </td>
                            <td>
                              <span className="text-xs">
                                {blog.created_at
                                  ? new Date(blog.created_at).toLocaleDateString()
                                  : ''}
                              </span>
                            </td>
                            <td>
                              <div className="relative ol-icon-dropdown ol-icon-dropdown-transparent">
                                <button
                                  className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200"
                                  type="button"
                                  data-bs-toggle="dropdown"
                                >
                                  <span className="fi-rr-menu-dots-vertical" />
                                </button>
                                <ul className="absolute mt-2 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-30">
                                  <li>
                                    <Link
                                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                      to={buildRoute(ROUTES.ADMIN_BLOG_EDIT, { id: blog.id })}
                                    >
                                      {translate('Edit')}
                                    </Link>
                                  </li>
                                  <li>
                                    <button
                                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                      type="button"
                                      onClick={() =>
                                        setConfirmModal({
                                          open: true,
                                          onConfirm: () => handleDelete(blog.id),
                                        })
                                      }
                                    >
                                      {translate('Delete')}
                                    </button>
                                  </li>
                                </ul>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Pagination
                    meta={meta}
                    onPageChange={(p) => updateFilter({ page: String(p) })}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmModal.open}
        onClose={() => setConfirmModal({ open: false })}
        onConfirm={confirmModal.onConfirm}
      />
    </>
  );
}
