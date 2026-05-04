/**
 * AdminCourses — 1:1 port of admin/course/index.blade.php
 * Stat cards (filter links), filter dropdown, search, paginated course table.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import NoData from '@/components/common/NoData';
import ConfirmModal from '@/components/common/ConfirmModal';
import Pagination from '@/components/common/Pagination';
import { useApi } from '@/hooks/useApi';
import { useSettings } from '@/contexts/SettingsContext';
import { API, ROUTES, buildRoute } from '@/config/routes';

const STATUS_OPTIONS = ['active', 'inactive', 'pending', 'upcoming', 'private', 'draft'];
const PRICE_OPTIONS = ['free', 'paid'];

const inputClass =
  'w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent';
const labelClass = 'block text-xs font-medium text-gray-700 mb-1';

const STATUS_BADGE = {
  active: 'bg-emerald-100 text-emerald-700',
  inactive: 'bg-gray-100 text-gray-700',
  pending: 'bg-amber-100 text-amber-700',
  upcoming: 'bg-sky-100 text-sky-700',
  private: 'bg-violet-100 text-violet-700',
  draft: 'bg-rose-100 text-rose-700',
};

export default function AdminCourses() {
  const { translate, formatCurrency } = useSettings();
  const { get, post, put, del } = useApi();
  const [searchParams, setSearchParams] = useSearchParams();

  const [courses, setCourses] = useState([]);
  const [meta, setMeta] = useState(null);
  const [stats, setStats] = useState({ active: 0, pending: 0, upcoming: 0, free: 0, paid: 0 });
  const [filterOptions, setFilterOptions] = useState({ categories: [], instructors: [] });
  const [loading, setLoading] = useState(true);

  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const [filterOpen, setFilterOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const filters = useMemo(
    () => ({
      search: searchParams.get('search') || '',
      category: searchParams.get('category') || '',
      status: searchParams.get('status') || '',
      instructor: searchParams.get('instructor') || '',
      price: searchParams.get('price') || '',
      page: searchParams.get('page') || '1',
    }),
    [searchParams]
  );

  const activeFilterCount = Object.entries(filters).filter(
    ([k, v]) => v && k !== 'page' && k !== 'search'
  ).length;

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
      const res = await get(API.ADMIN_COURSES, { params });
      setCourses(res.data || []);
      setMeta(res.meta || null);
      if (res.stats) setStats(res.stats);
    } catch {
      toast.error(translate('Failed to load courses'));
    } finally {
      setLoading(false);
    }
  }, [get, filters, translate]);

  const fetchFilterOptions = useCallback(async () => {
    try {
      const [cats, instructors] = await Promise.all([
        get(API.ADMIN_COURSE_CATEGORIES),
        get(API.ADMIN_COURSE_INSTRUCTORS),
      ]);
      setFilterOptions({
        categories: cats?.data || cats || [],
        instructors: instructors?.data || instructors || [],
      });
    } catch {
      /* non-fatal */
    }
  }, [get]);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);
  useEffect(() => { fetchFilterOptions(); }, [fetchFilterOptions]);

  const updateFilter = (patch) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([k, v]) => {
      if (v == null || v === '' || v === 'all') next.delete(k);
      else next.set(k, v);
    });
    if (!('page' in patch)) next.delete('page');
    setSearchParams(next);
  };

  const clearFilters = () => setSearchParams({});
  const onSearchSubmit = (e) => { e.preventDefault(); updateFilter({ search: searchInput }); };
  const onPageChange = (page) => {
    updateFilter({ page: String(page) });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const confirmAction = async () => {
    if (!pendingAction) return;
    setActionLoading(true);
    try {
      if (pendingAction.type === 'delete') {
        await del(API.ADMIN_COURSE(pendingAction.id));
        toast.success(translate('Course deleted successfully'));
      } else if (pendingAction.type === 'duplicate') {
        await post(API.ADMIN_COURSE_DUPLICATE(pendingAction.id));
        toast.success(translate('Course duplicated successfully'));
      } else if (pendingAction.type === 'status') {
        await put(API.ADMIN_COURSE_STATUS(pendingAction.id), { status: pendingAction.payload });
        toast.success(translate('Course status updated'));
      }
      setPendingAction(null);
      fetchCourses();
    } catch (err) {
      toast.error(err.response?.data?.message || translate('Action failed'));
    } finally {
      setActionLoading(false);
    }
  };

  const renderPrice = (course) => {
    if (course.is_paid === 0 || course.is_paid === false) {
      return (
        <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700">
          {translate('Free')}
        </span>
      );
    }
    if (course.discount_flag) {
      return (
        <span className="text-sm text-gray-900">
          {formatCurrency(course.discounted_price)}{' '}
          <del className="text-gray-400 text-xs">{formatCurrency(course.price)}</del>
        </span>
      );
    }
    return <span className="text-sm text-gray-900">{formatCurrency(course.price)}</span>;
  };

  const statCards = [
    { key: 'active', label: 'Active courses', filter: { status: 'active' }, color: 'bg-emerald-50 text-emerald-600' },
    { key: 'pending', label: 'Pending courses', filter: { status: 'pending' }, color: 'bg-amber-50 text-amber-600' },
    { key: 'upcoming', label: 'Upcoming courses', filter: { status: 'upcoming' }, color: 'bg-sky-50 text-sky-600' },
    { key: 'free', label: 'Free courses', filter: { price: 'free' }, color: 'bg-violet-50 text-violet-600' },
    { key: 'paid', label: 'Paid courses', filter: { price: 'paid' }, color: 'bg-rose-50 text-rose-600' },
  ];

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h4 className="flex items-center gap-2 text-base font-semibold text-gray-900">
            <i className="fi-rr-settings-sliders text-emerald-600" />
            {translate('Manage Courses')}
          </h4>
          <Link
            to={ROUTES.ADMIN_COURSE_CREATE}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <i className="fi-rr-plus" />
            <span>{translate('Add New Course')}</span>
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {statCards.map((card) => (
          <button
            key={card.key}
            type="button"
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-left hover:shadow-md transition-shadow"
            onClick={() => updateFilter(card.filter)}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${card.color}`}>
              <i className="fi-rr-e-learning text-sm" />
            </div>
            <p className="text-2xl font-semibold text-gray-900">{stats[card.key] ?? 0}</p>
            <p className="text-xs text-gray-500 mt-1">{translate(card.label)}</p>
          </button>
        ))}
      </div>

      {/* Table card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 relative">
            <button
              type="button"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-gray-100 text-gray-700 hover:bg-gray-200"
              onClick={() => setFilterOpen((v) => !v)}
            >
              <i className="fi-rr-filter" />
              <span>{translate('Filter')}</span>
              {activeFilterCount > 0 && (
                <span className="text-xs text-emerald-600">({activeFilterCount})</span>
              )}
            </button>
            {(activeFilterCount > 0 || filters.search) && (
              <button
                type="button"
                className="text-gray-500 hover:text-rose-600"
                onClick={clearFilters}
                title={translate('Clear')}
              >
                <i className="fi-rr-cross-circle" />
              </button>
            )}

            {filterOpen && (
              <div className="absolute left-0 top-full mt-2 w-80 bg-white border border-gray-100 rounded-xl shadow-lg p-4 z-20 space-y-3">
                <div>
                  <label className={labelClass}>{translate('Category')}</label>
                  <select
                    className={inputClass}
                    value={filters.category}
                    onChange={(e) => updateFilter({ category: e.target.value })}
                  >
                    <option value="">{translate('All')}</option>
                    {filterOptions.categories.map((c) => (
                      <option key={c.id || c.slug} value={c.slug}>
                        {c.parent_id ? `-- ${c.title}` : c.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>{translate('Status')}</label>
                  <select
                    className={inputClass}
                    value={filters.status}
                    onChange={(e) => updateFilter({ status: e.target.value })}
                  >
                    <option value="">{translate('All')}</option>
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {translate(s.charAt(0).toUpperCase() + s.slice(1))}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>{translate('Instructor')}</label>
                  <select
                    className={inputClass}
                    value={filters.instructor}
                    onChange={(e) => updateFilter({ instructor: e.target.value })}
                  >
                    <option value="">{translate('All')}</option>
                    {filterOptions.instructors.map((i) => (
                      <option key={i.id} value={i.id}>{i.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>{translate('Price')}</label>
                  <select
                    className={inputClass}
                    value={filters.price}
                    onChange={(e) => updateFilter({ price: e.target.value })}
                  >
                    <option value="">{translate('All')}</option>
                    {PRICE_OPTIONS.map((p) => (
                      <option key={p} value={p}>
                        {translate(p.charAt(0).toUpperCase() + p.slice(1))}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    className="px-3 py-1.5 rounded text-sm text-gray-600 hover:bg-gray-100"
                    onClick={() => setFilterOpen(false)}
                  >
                    {translate('Close')}
                  </button>
                </div>
              </div>
            )}
          </div>

          <form className="flex gap-2 w-full sm:w-auto" onSubmit={onSearchSubmit}>
            <input
              type="text"
              className={`${inputClass} sm:w-64`}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={translate('Search Title')}
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {translate('Search')}
            </button>
          </form>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : courses.length === 0 ? (
          <NoData message={translate('No courses found')} />
        ) : (
          <>
            <p className="text-xs text-gray-500 mb-3">
              {translate('Showing')} {courses.length} {translate('of')}{' '}
              {meta?.total ?? courses.length} {translate('data')}
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-medium text-gray-500 uppercase bg-gray-50 border-y border-gray-100">
                    <th scope="col" className="px-4 py-3">#</th>
                    <th scope="col" className="px-4 py-3">{translate('Title')}</th>
                    <th scope="col" className="px-4 py-3">{translate('Category')}</th>
                    <th scope="col" className="px-4 py-3">{translate('Lesson & Section')}</th>
                    <th scope="col" className="px-4 py-3">{translate('Enrolled Student')}</th>
                    <th scope="col" className="px-4 py-3">{translate('Status')}</th>
                    <th scope="col" className="px-4 py-3">{translate('Price')}</th>
                    <th scope="col" className="px-4 py-3 text-right">{translate('Options')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {courses.map((row, idx) => {
                    const indexNumber =
                      ((meta?.current_page || 1) - 1) * (meta?.per_page || courses.length) + idx + 1;
                    const badgeClass = STATUS_BADGE[row.status] || 'bg-gray-100 text-gray-700';
                    return (
                      <tr key={row.id} className="hover:bg-gray-50">
                        <th scope="row" className="px-4 py-3 font-medium text-gray-700">
                          {indexNumber}
                        </th>
                        <td className="px-4 py-3 min-w-[200px]">
                          <Link
                            to={`${buildRoute(ROUTES.ADMIN_COURSE_EDIT, { id: row.id })}?tab=curriculum`}
                            className="font-medium text-gray-900 hover:text-emerald-600"
                          >
                            {row.title?.charAt(0).toUpperCase() + row.title?.slice(1)}
                          </Link>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {translate('Instructor')}: {row.instructor?.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {translate('Email')}: {row.instructor?.email}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-700">
                          {row.category?.title}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-700">
                          <div>{translate('Lesson')}: {row.lesson_count ?? 0}</div>
                          <div>{translate('Section')}: {row.section_count ?? 0}</div>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-700">
                          {row.enrollment_count ?? 0} {translate('students')}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block text-xs font-medium px-2 py-1 rounded ${badgeClass}`}>
                            {translate(row.status?.charAt(0).toUpperCase() + row.status?.slice(1))}
                          </span>
                        </td>
                        <td className="px-4 py-3 min-w-[120px]">{renderPrice(row)}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="relative inline-block">
                            <button
                              type="button"
                              className="w-8 h-8 rounded-lg hover:bg-gray-100 text-gray-600 inline-flex items-center justify-center"
                              onClick={() => setMenuOpen(menuOpen === row.id ? null : row.id)}
                            >
                              <i className="fi-rr-menu-dots-vertical" />
                            </button>
                            {menuOpen === row.id && (
                              <ul className="absolute right-0 mt-2 w-52 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-20 text-left">
                                <li>
                                  <Link
                                    to={`${buildRoute(ROUTES.ADMIN_COURSE_EDIT, { id: row.id })}?tab=basic`}
                                    className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                    onClick={() => setMenuOpen(null)}
                                  >
                                    {translate('Edit Course')}
                                  </Link>
                                </li>
                                <li>
                                  <button
                                    type="button"
                                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                    onClick={() => {
                                      setMenuOpen(null);
                                      setPendingAction({ type: 'duplicate', id: row.id });
                                    }}
                                  >
                                    {translate('Duplicate Course')}
                                  </button>
                                </li>
                                {row.status === 'active' ? (
                                  <li>
                                    <button
                                      type="button"
                                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                      onClick={() => {
                                        setMenuOpen(null);
                                        setPendingAction({ type: 'status', id: row.id, payload: 'inactive' });
                                      }}
                                    >
                                      {translate('Make As Inactive')}
                                    </button>
                                  </li>
                                ) : (
                                  <li>
                                    <button
                                      type="button"
                                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                      onClick={() => {
                                        setMenuOpen(null);
                                        setPendingAction({ type: 'status', id: row.id, payload: 'active' });
                                      }}
                                    >
                                      {translate('Make As Active')}
                                    </button>
                                  </li>
                                )}
                                <li>
                                  <button
                                    type="button"
                                    className="w-full text-left px-3 py-2 text-sm text-rose-600 hover:bg-rose-50"
                                    onClick={() => {
                                      setMenuOpen(null);
                                      setPendingAction({ type: 'delete', id: row.id });
                                    }}
                                  >
                                    {translate('Delete Course')}
                                  </button>
                                </li>
                              </ul>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between flex-wrap gap-3 mt-4">
              <p className="text-xs text-gray-500">
                {translate('Showing')} {courses.length} {translate('of')}{' '}
                {meta?.total ?? courses.length} {translate('data')}
              </p>
              <Pagination meta={meta} onPageChange={onPageChange} />
            </div>
          </>
        )}
      </div>

      <ConfirmModal
        isOpen={!!pendingAction}
        onClose={() => !actionLoading && setPendingAction(null)}
        onConfirm={confirmAction}
        loading={actionLoading}
      />
    </div>
  );
}
