/**
 * AdminBootcamps - Admin bootcamp management list.
 *
 * ============================================================================
 * ORIGINAL BLADE: resources/views/admin/bootcamp/index.blade.php
 * ============================================================================
 *
 * Paginated table of bootcamps with filter panel (category, status,
 * instructor, price), search, and per-row actions (edit, duplicate,
 * toggle status, delete). Mirrors the AdminCourses pattern.
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

export default function AdminBootcamps() {
  const { translate, formatCurrency } = useSettings();
  const { get, post, del } = useApi();
  const [searchParams, setSearchParams] = useSearchParams();

  const [bootcamps, setBootcamps] = useState([]);
  const [meta, setMeta] = useState(null);
  const [categories, setCategories] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmModal, setConfirmModal] = useState({ open: false });
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');

  const page = searchParams.get('page') || '1';
  const category = searchParams.get('category') || '';
  const status = searchParams.get('status') || '';
  const instructor = searchParams.get('instructor') || '';
  const price = searchParams.get('price') || '';
  const search = searchParams.get('search') || '';

  const fetchBootcamps = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page };
      if (category) params.category = category;
      if (status) params.status = status;
      if (instructor) params.instructor = instructor;
      if (price) params.price = price;
      if (search) params.search = search;

      const res = await get(API.ADMIN_BOOTCAMPS, { params });
      setBootcamps(res.data || []);
      setMeta(res.meta || null);
      if (res.categories) setCategories(res.categories);
      if (res.instructors) setInstructors(res.instructors);
    } catch {
      toast.error(translate('Failed to load bootcamps'));
    } finally {
      setLoading(false);
    }
  }, [get, page, category, status, instructor, price, search, translate]);

  useEffect(() => {
    fetchBootcamps();
  }, [fetchBootcamps]);

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

  const handleToggleStatus = async (id) => {
    try {
      await post(`${API.ADMIN_BOOTCAMPS}/${id}/status`);
      toast.success(translate('Status updated'));
      fetchBootcamps();
    } catch {
      toast.error(translate('Failed to update status'));
    }
    setConfirmModal({ open: false });
  };

  const handleDuplicate = async (id) => {
    try {
      await post(`${API.ADMIN_BOOTCAMPS}/${id}/duplicate`);
      toast.success(translate('Bootcamp duplicated'));
      fetchBootcamps();
    } catch {
      toast.error(translate('Failed to duplicate'));
    }
    setConfirmModal({ open: false });
  };

  const handleDelete = async (id) => {
    try {
      await del(API.ADMIN_BOOTCAMP(id));
      toast.success(translate('Bootcamp deleted'));
      fetchBootcamps();
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
              {translate('Manage Bootcamp')}
            </h4>
            <Link
              to={ROUTES.ADMIN_BOOTCAMP_CREATE}
              className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors border border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center cg-10px"
            >
              <span className="fi-rr-plus" />
              <span>{translate('Add New Bootcamp')}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-wrap -mx-3">
        <div className="w-full">
          <div className="ol-card">
            <div className="ol-card-body mb-5 p-3">
              {/* Filters and search row */}
              <div className="flex flex-wrap -mx-3 mb-4 mt-3">
                <div className="w-full md:w-1/2 flex items-center gap-3">
                  <select
                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={category}
                    onChange={(e) => updateFilter({ category: e.target.value })}
                  >
                    <option value="">{translate('All Categories')}</option>
                    {categories.map((cat) => (
                      <option key={cat.id || cat.slug} value={cat.slug}>
                        {cat.title}
                      </option>
                    ))}
                  </select>

                  <select
                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={status}
                    onChange={(e) => updateFilter({ status: e.target.value })}
                  >
                    <option value="">{translate('All Status')}</option>
                    <option value="active">{translate('Active')}</option>
                    <option value="inactive">{translate('Inactive')}</option>
                  </select>

                  <select
                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={price}
                    onChange={(e) => updateFilter({ price: e.target.value })}
                  >
                    <option value="">{translate('All Prices')}</option>
                    <option value="free">{translate('Free')}</option>
                    <option value="paid">{translate('Paid')}</option>
                    <option value="discounted">{translate('Discounted')}</option>
                  </select>
                </div>

                <div className="w-full md:w-1/2 mt-md-0 mt-3">
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
              ) : bootcamps.length === 0 ? (
                <NoData message={translate('No bootcamps found')} />
              ) : (
                <>
                  <div className="overflow-x-auto overflow-auto">
                    <table className="eTable eTable-2 w-full">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>{translate('Title')}</th>
                          <th>{translate('Category')}</th>
                          <th>{translate('Module & Class')}</th>
                          <th>{translate('Enrolled Student')}</th>
                          <th>{translate('Status')}</th>
                          <th>{translate('Price')}</th>
                          <th>{translate('Options')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bootcamps.map((bootcamp, idx) => (
                          <tr key={bootcamp.id}>
                            <td>{(meta?.from || 1) + idx}</td>
                            <td>
                              <div className="dAdmin_profile flex items-center min-w-200px">
                                <div className="dAdmin_profile_name">
                                  <h4 className="title text-sm">
                                    <Link
                                      to={buildRoute(ROUTES.ADMIN_BOOTCAMP_EDIT, {
                                        id: bootcamp.id,
                                      })}
                                    >
                                      {bootcamp.title}
                                    </Link>
                                  </h4>
                                  <p className="sub-title2 text-xs">
                                    {translate('Instructor')}: {bootcamp.instructor_name}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className="text-xs">{bootcamp.category}</span>
                            </td>
                            <td>
                              <p className="text-xs">
                                {translate('Module')}: {bootcamp.module_count ?? 0}
                              </p>
                              <p className="text-xs">
                                {translate('Class')}: {bootcamp.class_count ?? 0}
                              </p>
                            </td>
                            <td>
                              <p className="text-xs">
                                {translate('Enrollments')}: {bootcamp.enroll_count ?? 0}
                              </p>
                            </td>
                            <td>
                              <span
                                className={`inline-block text-xs font-medium px-2 py-0.5 rounded bg-${bootcamp.status ? 'active' : 'inactive'}`}
                              >
                                {translate(bootcamp.status ? 'Active' : 'Inactive')}
                              </span>
                            </td>
                            <td>
                              {bootcamp.is_paid == 0 ? (
                                <span className="eBadge ebg-soft-success">
                                  {translate('Free')}
                                </span>
                              ) : (
                                <span>{formatCurrency(bootcamp.price - (bootcamp.discounted_price || 0))}</span>
                              )}
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
                                      to={buildRoute(ROUTES.ADMIN_BOOTCAMP_EDIT, {
                                        id: bootcamp.id,
                                      })}
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
                                          onConfirm: () => handleToggleStatus(bootcamp.id),
                                        })
                                      }
                                    >
                                      {translate(
                                        bootcamp.status ? 'Make As Inactive' : 'Make As Active',
                                      )}
                                    </button>
                                  </li>
                                  <li>
                                    <button
                                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                      type="button"
                                      onClick={() =>
                                        setConfirmModal({
                                          open: true,
                                          onConfirm: () => handleDuplicate(bootcamp.id),
                                        })
                                      }
                                    >
                                      {translate('Duplicate')}
                                    </button>
                                  </li>
                                  <li>
                                    <button
                                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                      type="button"
                                      onClick={() =>
                                        setConfirmModal({
                                          open: true,
                                          onConfirm: () => handleDelete(bootcamp.id),
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
