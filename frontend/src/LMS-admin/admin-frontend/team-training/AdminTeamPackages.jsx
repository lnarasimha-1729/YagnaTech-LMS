/**
 * AdminTeamPackages — port of admin/team_training/index.blade.php.
 * Paginated table of team training packages with search + per-row actions
 * (view, edit, duplicate, toggle status, delete).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import NoData from '@/components/common/NoData';
import Pagination from '@/components/common/Pagination';
import ConfirmModal from '@/components/common/ConfirmModal';
import { useApi } from '@/hooks/useApi';
import { useSettings } from '@/contexts/SettingsContext';
import { API } from '@/config/routes';

export default function AdminTeamPackages() {
  const { translate, formatCurrency, getImage } = useSettings();
  const { get, post, del } = useApi();
  const [searchParams, setSearchParams] = useSearchParams();

  const [packages, setPackages] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [confirm, setConfirm] = useState({ open: false });
  const menuRef = useRef(null);

  const page = searchParams.get('page') || '1';
  const search = searchParams.get('search') || '';

  const fetchPackages = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page };
      if (search) params.search = search;
      const res = await get(API.ADMIN_TEAM_PACKAGES, { params });
      setPackages(res.data || []);
      setMeta(res.meta || null);
    } catch {
      toast.error(translate('Failed to load packages'));
    } finally {
      setLoading(false);
    }
  }, [get, page, search, translate]);

  useEffect(() => { fetchPackages(); }, [fetchPackages]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpenMenuId(null);
    };
    if (openMenuId != null) document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [openMenuId]);

  const onSearch = (e) => {
    e.preventDefault();
    const next = new URLSearchParams(searchParams);
    if (searchInput.trim()) next.set('search', searchInput.trim());
    else next.delete('search');
    next.delete('page');
    setSearchParams(next);
  };

  const clearSearch = () => {
    setSearchInput('');
    const next = new URLSearchParams(searchParams);
    next.delete('search');
    next.delete('page');
    setSearchParams(next);
  };

  const doDuplicate = async (id) => {
    setOpenMenuId(null);
    try {
      await post(API.ADMIN_TEAM_PACKAGE_DUPLICATE(id));
      toast.success(translate('Package duplicated'));
      fetchPackages();
    } catch {
      toast.error(translate('Failed to duplicate'));
    }
  };

  const doToggle = async (id) => {
    setOpenMenuId(null);
    try {
      await post(API.ADMIN_TEAM_PACKAGE_STATUS(id));
      fetchPackages();
    } catch {
      toast.error(translate('Failed to update status'));
    }
  };

  const doDelete = async (id) => {
    try {
      await del(API.ADMIN_TEAM_PACKAGE(id));
      toast.success(translate('Package deleted'));
      fetchPackages();
    } catch {
      toast.error(translate('Failed to delete'));
    } finally {
      setConfirm({ open: false });
    }
  };

  return (
    <>
      <div className="bg-white border border-gray-100 rounded-lg mb-4">
        <div className="flex items-center justify-between px-5 py-3 flex-wrap gap-3">
          <h4 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <i className="fi-rr-settings-sliders" />
            {translate('Manage Packages')}
          </h4>
          <Link
            to="/admin/team-packages/create"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <span className="fi-rr-plus" />
            <span>{translate('Add New Package')}</span>
          </Link>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-lg p-4">
        <form onSubmit={onSearch} className="flex flex-wrap gap-2 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={translate('Search Title')}
              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {search && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label={translate('Clear')}
              >
                <i className="fi fi-rr-cross-circle" />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="px-5 py-2 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700"
          >
            {translate('Search')}
          </button>
        </form>

        {loading ? (
          <LoadingSpinner />
        ) : packages.length === 0 ? (
          <NoData />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase text-gray-500 border-b border-gray-200">
                    <th className="px-3 py-2">#</th>
                    <th className="px-3 py-2">{translate('Title')}</th>
                    <th className="px-3 py-2 text-center">{translate('Allocation')}</th>
                    <th className="px-3 py-2 text-center">{translate('Purchases')}</th>
                    <th className="px-3 py-2">{translate('Status')}</th>
                    <th className="px-3 py-2">{translate('Price')}</th>
                    <th className="px-3 py-2 text-center">{translate('Options')}</th>
                  </tr>
                </thead>
                <tbody>
                  {packages.map((pkg, idx) => {
                    const isOpen = openMenuId === pkg.id;
                    return (
                      <tr key={pkg.id} className="border-b border-gray-100 align-middle">
                        <td className="px-3 py-3">{(meta?.from || 1) + idx}</td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={getImage ? getImage(pkg.thumbnail) : pkg.thumbnail}
                              alt=""
                              className="w-10 h-10 rounded-full object-cover"
                            />
                            <div>
                              <Link
                                to={`/admin/team-packages/${pkg.id}/edit`}
                                className="text-sm font-medium text-gray-900 capitalize hover:text-emerald-600"
                              >
                                {pkg.title}
                              </Link>
                              {pkg.course_title && (
                                <p className="text-xs text-gray-500">{pkg.course_title}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-center text-xs text-gray-600">
                          {pkg.allocation} / {pkg.reserved ?? 0}
                        </td>
                        <td className="px-3 py-3 text-center text-xs text-gray-600">
                          {pkg.purchases_count ?? 0}
                        </td>
                        <td className="px-3 py-3">
                          <span
                            className={`inline-block text-xs font-medium px-2 py-0.5 rounded ${
                              pkg.status
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {translate(pkg.status ? 'Active' : 'Inactive')}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          {pkg.pricing_type === 0 ? (
                            <span className="inline-block text-xs font-medium px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                              {translate('Free')}
                            </span>
                          ) : (
                            <div className="text-sm">
                              <span className="font-medium text-gray-900">
                                {formatCurrency(pkg.price)}
                              </span>
                              {pkg.original_price ? (
                                <del className="ml-2 text-xs text-gray-400">
                                  {formatCurrency(pkg.original_price)}
                                </del>
                              ) : null}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          <div className="relative flex justify-center" ref={isOpen ? menuRef : null}>
                            <button
                              type="button"
                              className="w-8 h-8 inline-flex items-center justify-center rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200"
                              onClick={() => setOpenMenuId(isOpen ? null : pkg.id)}
                            >
                              <span className="fi-rr-menu-dots-vertical" />
                            </button>
                            {isOpen && (
                              <ul className="absolute right-0 top-10 w-40 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-30">
                                <li>
                                  <a
                                    href={`/team-packages/${pkg.slug}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="block px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                                  >
                                    {translate('Frontend View')}
                                  </a>
                                </li>
                                <li>
                                  <Link
                                    to={`/admin/team-packages/${pkg.id}/edit`}
                                    className="block px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                                  >
                                    {translate('Edit')}
                                  </Link>
                                </li>
                                <li>
                                  <button
                                    type="button"
                                    className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                                    onClick={() => doDuplicate(pkg.id)}
                                  >
                                    {translate('Duplicate')}
                                  </button>
                                </li>
                                <li>
                                  <button
                                    type="button"
                                    className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                                    onClick={() => doToggle(pkg.id)}
                                  >
                                    {pkg.status
                                      ? translate('Make As Inactive')
                                      : translate('Make As Active')}
                                  </button>
                                </li>
                                <li>
                                  <button
                                    type="button"
                                    className="w-full text-left px-3 py-1.5 text-sm text-rose-600 hover:bg-rose-50"
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      setConfirm({
                                        open: true,
                                        onConfirm: () => doDelete(pkg.id),
                                      });
                                    }}
                                  >
                                    {translate('Delete')}
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

      <ConfirmModal
        isOpen={confirm.open}
        onClose={() => setConfirm({ open: false })}
        onConfirm={confirm.onConfirm}
        title={translate('Delete this package?')}
        message={translate("You can't bring it back!")}
      />
    </>
  );
}
