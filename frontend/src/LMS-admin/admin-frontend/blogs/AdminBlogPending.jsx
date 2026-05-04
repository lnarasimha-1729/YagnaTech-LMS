/**
 * AdminBlogPending - List of pending (instructor-submitted) blog posts.
 *
 * ============================================================================
 * ORIGINAL BLADE: resources/views/admin/blog/pending.blade.php
 * ============================================================================
 *
 * Table with creator info, title, category, status toggle, edit/delete actions.
 */

import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import NoData from '@/components/common/NoData';
import Pagination from '@/components/common/Pagination';
import ConfirmModal from '@/components/common/ConfirmModal';
import { useApi } from '@/hooks/useApi';
import { useSettings } from '@/contexts/SettingsContext';
import { API, ROUTES, buildRoute } from '@/config/routes';

export default function AdminBlogPending() {
  const { translate, getImage } = useSettings();
  const { get, post, del } = useApi();
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
      const res = await get(API.ADMIN_BLOG_PENDING, { params });
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

  const onSearch = (e) => {
    e.preventDefault();
    const next = new URLSearchParams(searchParams);
    if (searchInput) next.set('search', searchInput);
    else next.delete('search');
    next.delete('page');
    setSearchParams(next);
  };

  const toggleStatus = async (id) => {
    try {
      await post(API.ADMIN_BLOG_STATUS(id));
      toast.success(translate('Status updated'));
      fetchBlogs();
    } catch {
      toast.error(translate('Failed to update status'));
    }
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
      <div className="ol-card radius-8px">
        <div className="ol-card-body px-20px my-3 py-4">
          <h4 className="title text-base">
            <i className="fi-rr-settings-sliders mr-2" />
            <span>{translate('Pending Blog')}</span>
          </h4>
        </div>
      </div>

      <div className="flex flex-wrap -mx-3">
        <div className="w-full">
          <div className="ol-card">
            <div className="ol-card-body p-3">
              <div className="flex flex-wrap -mx-3 mb-3 mt-3">
                <div className="w-full md:w-1/2" />
                <div className="w-full md:w-1/2">
                  <form onSubmit={onSearch}>
                    <div className="flex flex-wrap -mx-3 row-gap-3">
                      <div className="w-full md:w-9/12">
                        <input
                          className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          type="text"
                          value={searchInput}
                          onChange={(e) => setSearchInput(e.target.value)}
                          placeholder={translate('Search Title')}
                        />
                      </div>
                      <div className="w-full md:w-1/4">
                        <button className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-indigo-600 text-white hover:bg-indigo-700 w-full" type="submit">
                          {translate('Search')}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>

              {loading ? (
                <LoadingSpinner />
              ) : blogs.length === 0 ? (
                <NoData />
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="eTable eTable-2 w-full">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>{translate('Creator')}</th>
                          <th>{translate('Title')}</th>
                          <th>{translate('Category')}</th>
                          <th>{translate('Status')}</th>
                          <th>{translate('Options')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {blogs.map((blog, idx) => (
                          <tr key={blog.id}>
                            <td>{(meta?.from || 1) + idx}</td>
                            <td>
                              <div className="dAdmin_profile flex items-center min-w-200px">
                                {blog.user?.photo && (
                                  <div className="dAdmin_profile_img mr-1">
                                    <img
                                      className="img-fluid rounded-full"
                                      src={getImage(blog.user.photo)}
                                      width="40"
                                      height="40"
                                      alt=""
                                    />
                                  </div>
                                )}
                                <div className="ml-1">
                                  <h4 className="title text-sm">{blog.user?.name}</h4>
                                  <p className="sub-title2 text-xs">{blog.user?.email}</p>
                                </div>
                              </div>
                            </td>
                            <td>
                              <p>{blog.title}</p>
                              <small className="text-gray-500">
                                {blog.created_at && new Date(blog.created_at).toLocaleDateString()}
                              </small>
                            </td>
                            <td>{blog.category_title || '-'}</td>
                            <td>
                              <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded${blog.status ? 'bg-success' : 'bg-danger'}`}>
                                {translate(blog.status ? 'Active' : 'Inactive')}
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
                                    <Link className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" to={buildRoute(ROUTES.ADMIN_BLOG_EDIT, { id: blog.id })}>
                                      {translate('Edit')}
                                    </Link>
                                  </li>
                                  <li>
                                    <button className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => toggleStatus(blog.id)}>
                                      {translate(blog.status ? 'Inactive' : 'Activate')}
                                    </button>
                                  </li>
                                  <li>
                                    <button
                                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                      onClick={() =>
                                        setConfirmModal({ open: true, onConfirm: () => handleDelete(blog.id) })
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
                    onPageChange={(p) => {
                      const next = new URLSearchParams(searchParams);
                      next.set('page', String(p));
                      setSearchParams(next);
                    }}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal isOpen={confirmModal.open} onClose={() => setConfirmModal({ open: false })} onConfirm={confirmModal.onConfirm} />
    </>
  );
}
