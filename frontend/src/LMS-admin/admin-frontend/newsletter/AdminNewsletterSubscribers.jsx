/**
 * AdminNewsletterSubscribers - List of newsletter subscribers with search + delete.
 *
 * ============================================================================
 * ORIGINAL BLADE: resources/views/admin/newsletter/subscribers.blade.php
 * ============================================================================
 */

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import NoData from '@/components/common/NoData';
import Pagination from '@/components/common/Pagination';
import ConfirmModal from '@/components/common/ConfirmModal';
import { useApi } from '@/hooks/useApi';
import { useSettings } from '@/contexts/SettingsContext';

export default function AdminNewsletterSubscribers() {
  const { translate } = useSettings();
  const { get, del } = useApi();
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('search') || '';
  const page = Number(searchParams.get('page') || 1);

  const [searchInput, setSearchInput] = useState(search);
  const [loading, setLoading] = useState(true);
  const [subscribers, setSubscribers] = useState([]);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [confirm, setConfirm] = useState(null);

  const fetchSubscribers = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (search) qs.set('search', search);
      qs.set('page', page);
      const res = await get(`/api/admin/newsletter/subscribers?${qs}`);
      const data = res.data || res;
      setSubscribers(data.data || data.subscribers || []);
      setPagination({
        current_page: data.current_page || 1,
        last_page: data.last_page || 1,
        total: data.total || 0,
      });
    } catch {
      toast.error(translate('Failed to load subscribers'));
    } finally {
      setLoading(false);
    }
  }, [get, search, page, translate]);

  useEffect(() => { fetchSubscribers(); }, [fetchSubscribers]);

  const onSearch = (e) => {
    e.preventDefault();
    const next = new URLSearchParams(searchParams);
    if (searchInput) next.set('search', searchInput);
    else next.delete('search');
    next.delete('page');
    setSearchParams(next);
  };

  const handleDelete = async (id) => {
    try {
      await del(`/api/admin/newsletter/subscribers/${id}`);
      toast.success(translate('Deleted'));
      fetchSubscribers();
    } catch {
      toast.error(translate('Failed to delete'));
    } finally {
      setConfirm(null);
    }
  };

  return (
    <>
      <div className="bg-white border border-gray-100 rounded-lg">
        <div className="px-5 my-3 py-4">
          <h4 className="title text-base mb-0">
            <i className="fi-rr-settings-sliders mr-2" />
            {translate('Subscribers')}
          </h4>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-lg p-4">
        <div className="">
          <div className="flex flex-wrap row-gap-3 mb-3">
            <div className="w-full md:w-1/2">
              <button type="button" className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200" onClick={() => window.print()}>
                {translate('Print')} <i className="fi-rr-print ml-2" />
              </button>
            </div>
            <div className="w-full md:w-1/2">
              <form onSubmit={onSearch}>
                <div className="flex flex-wrap row-gap-3">
                  <div className="w-full md:w-9/12">
                    <input
                      className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      type="text"
                      placeholder={translate('Search Email')}
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                    />
                  </div>
                  <div className="w-full md:w-1/4">
                    <button type="submit" className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-emerald-600 text-white hover:bg-emerald-700 w-full">
                      {translate('Search')}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {loading ? (
            <LoadingSpinner />
          ) : subscribers.length === 0 ? (
            <NoData />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>{translate('Email')}</th>
                      <th>{translate('User status')}</th>
                      <th>{translate('Actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscribers.map((s, i) => (
                      <tr key={s.id}>
                        <td>{(pagination.current_page - 1) * 10 + i + 1}</td>
                        <td>{s.email}</td>
                        <td>
                          {s.is_registered ? (
                            <span className="inline-block text-xs font-medium px-2 py-0.5 rounded bg-green-500">{translate('Registered User')}</span>
                          ) : (
                            <span className="inline-block text-xs font-medium px-2 py-0.5 rounded bg-yellow-500">{translate('Not Registered')}</span>
                          )}
                        </td>
                        <td>
                          <button
                            type="button"
                            className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200 ol-icon-btn"
                            onClick={() => setConfirm({ id: s.id })}
                            title={translate('Delete')}
                          >
                            <i className="fi-rr-trash" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-between items-center flex-wrap gap-2">
                <p className="admin-tInfo mb-0">
                  {translate('Showing')} {subscribers.length} {translate('of')} {pagination.total} {translate('data')}
                </p>
                {pagination.last_page > 1 && (
                  <Pagination
                    currentPage={pagination.current_page}
                    lastPage={pagination.last_page}
                    onPageChange={(p) => {
                      const next = new URLSearchParams(searchParams);
                      next.set('page', p);
                      setSearchParams(next);
                    }}
                  />
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {confirm && (
        <ConfirmModal
          message={translate('Delete this subscriber?')}
          onConfirm={() => handleDelete(confirm.id)}
          onCancel={() => setConfirm(null)}
        />
      )}
    </>
  );
}
