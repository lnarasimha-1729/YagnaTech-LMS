/**
 * AdminUsers — generic list for admins, instructors, students.
 * Ports index.blade.php for admin/admin, admin/instructor, admin/student.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import PropTypes from 'prop-types';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import NoData from '@/components/common/NoData';
import ConfirmModal from '@/components/common/ConfirmModal';
import Pagination from '@/components/common/Pagination';
import { useApi } from '@/hooks/useApi';
import { useSettings } from '@/contexts/SettingsContext';
import { API, ROUTES } from '@/config/routes';

const CONFIG = {
  admin: {
    title: 'Admin List',
    addLabel: 'Add new Admin',
    apiList: API.ADMIN_ADMINS,
    createRoute: ROUTES.ADMIN_ADMIN_CREATE,
    editRoute: ROUTES.ADMIN_ADMIN_EDIT,
  },
  instructor: {
    title: 'Instructor List',
    addLabel: 'Add new Instructor',
    apiList: API.ADMIN_INSTRUCTORS,
    createRoute: ROUTES.ADMIN_INSTRUCTOR_CREATE,
    editRoute: ROUTES.ADMIN_INSTRUCTOR_EDIT,
  },
  student: {
    title: 'Student List',
    addLabel: 'Add new Student',
    apiList: API.ADMIN_STUDENTS,
    createRoute: ROUTES.ADMIN_STUDENT_CREATE,
    editRoute: ROUTES.ADMIN_STUDENT_EDIT,
  },
};

export default function AdminUsers({ userType }) {
  const cfg = CONFIG[userType];
  const { translate, getImage } = useSettings();
  const { get, post, del } = useApi();
  const [searchParams, setSearchParams] = useSearchParams();

  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmState, setConfirmState] = useState({ open: false });
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);

  const page = searchParams.get('page') || '1';
  const search = searchParams.get('search') || '';

  useEffect(() => {
    const close = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpenMenuId(null);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page };
      if (search) params.search = search;
      const res = await get(cfg.apiList, { params });
      setUsers(res.data || []);
      setMeta(res.meta || null);
    } catch {
      toast.error(translate('Failed to load users'));
    } finally {
      setLoading(false);
    }
  }, [get, cfg.apiList, page, search, translate]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

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
      await del(`${cfg.apiList}/${id}`);
      toast.success(translate('User deleted'));
      fetchUsers();
    } catch {
      toast.error(translate('Failed to delete user'));
    } finally {
      setConfirmState({ open: false });
    }
  };

  const handleRevoke = async (id) => {
    try {
      await post(API.ADMIN_INSTRUCTOR_REVOKE(id), {});
      toast.success(translate('Instructor access revoked'));
      fetchUsers();
    } catch {
      toast.error(translate('Failed to revoke access'));
    } finally {
      setConfirmState({ open: false });
    }
  };

  const buildEditRoute = (id) => cfg.editRoute.replace(':id', id);

  return (
    <>
      <div className="bg-white border border-gray-100 rounded-lg mb-4">
        <div className="flex items-center justify-between px-5 py-3 flex-wrap gap-3">
          <h4 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <i className="fi-rr-settings-sliders" />
            {translate(cfg.title)}
          </h4>
          <Link
            to={cfg.createRoute}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <span className="fi-rr-plus" />
            <span>{translate(cfg.addLabel)}</span>
          </Link>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-lg p-4">
        <div className="mb-4 flex justify-end">
          <form onSubmit={onSearchSubmit} className="flex items-center gap-2 w-full md:w-1/2">
            <input
              className="flex-1 bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={translate('Search user')}
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
        ) : users.length === 0 ? (
          <NoData message={translate('No users found')} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase text-gray-500 border-b border-gray-200">
                    <th className="px-3 py-2">#</th>
                    <th className="px-3 py-2">{translate('Name')}</th>
                    <th className="px-3 py-2">{translate('Phone')}</th>
                    {userType === 'instructor' && (
                      <th className="px-3 py-2">{translate('Number Of Course')}</th>
                    )}
                    <th className="px-3 py-2 text-center">{translate('Options')}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, idx) => (
                    <tr key={user.id} className="border-b border-gray-100 align-middle">
                      <td className="px-3 py-3">{(meta?.from || 1) + idx}</td>
                      <td className="px-3 py-3 min-w-[220px]">
                        <div className="flex items-center gap-3">
                          <img
                            src={getImage ? getImage(user.photo) : user.photo}
                            alt=""
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{user.name}</p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 min-w-[150px] text-sm text-gray-700">
                        {user.phone || '-'}
                      </td>
                      {userType === 'instructor' && (
                        <td className="px-3 py-3 text-sm text-gray-700">
                          {(user.course_count ?? 0)} {translate('Courses')}
                        </td>
                      )}
                      <td className="px-3 py-3 text-center relative">
                        <button
                          type="button"
                          onClick={() => setOpenMenuId(openMenuId === user.id ? null : user.id)}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:bg-gray-100"
                        >
                          <span className="fi-rr-menu-dots-vertical" />
                        </button>
                        {openMenuId === user.id && (
                          <ul
                            ref={menuRef}
                            className="absolute right-3 mt-2 w-52 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-30 text-left"
                          >
                            {userType === 'instructor' && (
                              <li>
                                <Link
                                  to={`/admin/courses?instructor=${user.id}`}
                                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                  onClick={() => setOpenMenuId(null)}
                                >
                                  {translate('View courses')}
                                </Link>
                              </li>
                            )}
                            <li>
                              <Link
                                to={buildEditRoute(user.id)}
                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                onClick={() => setOpenMenuId(null)}
                              >
                                {translate('Edit')}
                              </Link>
                            </li>
                            <li>
                              <button
                                type="button"
                                className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  setConfirmState({
                                    open: true,
                                    title: translate('Remove account'),
                                    message: translate("You can't bring it back!"),
                                    onConfirm: () => handleDelete(user.id),
                                  });
                                }}
                              >
                                {userType === 'instructor' ? translate('Remove account') : translate('Delete')}
                              </button>
                            </li>
                            {userType === 'instructor' && (
                              <li>
                                <button
                                  type="button"
                                  className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    setConfirmState({
                                      open: true,
                                      title: translate('Revoke Instructor Access'),
                                      message: translate('This user will become a regular student.'),
                                      onConfirm: () => handleRevoke(user.id),
                                    });
                                  }}
                                >
                                  {translate('Revoke Instructor Access')}
                                </button>
                              </li>
                            )}
                          </ul>
                        )}
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

      <ConfirmModal
        isOpen={confirmState.open}
        onClose={() => setConfirmState({ open: false })}
        onConfirm={confirmState.onConfirm || (() => {})}
        title={confirmState.title}
        message={confirmState.message}
      />
    </>
  );
}

AdminUsers.propTypes = {
  userType: PropTypes.oneOf(['admin', 'instructor', 'student']).isRequired,
};
