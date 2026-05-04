/**
 * AdminEnrollments - Enrollment history list.
 *
 * ============================================================================
 * ORIGINAL BLADE: resources/views/admin/enroll/index.blade.php
 * ============================================================================
 *
 * Paginated table of enrollment records with date-range filter, search,
 * and per-row delete action.
 */

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import NoData from '@/components/common/NoData';
import ConfirmModal from '@/components/common/ConfirmModal';
import Pagination from '@/components/common/Pagination';
import { useApi } from '@/hooks/useApi';
import { useSettings } from '@/contexts/SettingsContext';
import { API } from '@/config/routes';

export default function AdminEnrollments() {
  const { translate, getImage } = useSettings();
  const { get, del } = useApi();
  const [searchParams, setSearchParams] = useSearchParams();

  const [enrollments, setEnrollments] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmModal, setConfirmModal] = useState({ open: false });

  const page = searchParams.get('page') || '1';
  const dateRange = searchParams.get('date_range') || '';

  const fetchEnrollments = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page };
      if (dateRange) params.date_range = dateRange;
      const res = await get(API.ADMIN_ENROLLMENTS, { params });
      setEnrollments(res.data || []);
      setMeta(res.meta || null);
    } catch {
      toast.error(translate('Failed to load enrollments'));
    } finally {
      setLoading(false);
    }
  }, [get, page, dateRange, translate]);

  useEffect(() => {
    fetchEnrollments();
  }, [fetchEnrollments]);

  const updateFilter = (patch) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([k, v]) => {
      if (!v) next.delete(k);
      else next.set(k, v);
    });
    if (!('page' in patch)) next.delete('page');
    setSearchParams(next);
  };

  const handleDelete = async (id) => {
    try {
      await del(`${API.ADMIN_ENROLLMENTS}/${id}`);
      toast.success(translate('Enrollment deleted'));
      fetchEnrollments();
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
              {translate('Enroll History')}
            </h4>
          </div>
        </div>
      </div>

      <div className="ol-card">
        <div className="ol-card-body p-3">
          {/* Table */}
          {loading ? (
            <LoadingSpinner />
          ) : enrollments.length === 0 ? (
            <NoData message={translate('No enrollment history found')} />
          ) : (
            <>
              <div className="overflow-x-auto overflow-auto">
                <table className="eTable eTable-2 w-full">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>{translate('Name')}</th>
                      <th>{translate('Enrolled Course')}</th>
                      <th>{translate('Enrolled Date')}</th>
                      <th>{translate('Expiry Date')}</th>
                      <th>{translate('Option')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrollments.map((row, idx) => (
                      <tr key={row.id}>
                        <td>{(meta?.from || 1) + idx}</td>
                        <td>
                          <div className="dAdmin_profile flex items-center min-w-200px">
                            <div className="dAdmin_profile_img">
                              <img
                                className="img-fluid rounded-full image-45"
                                src={getImage(row.photo)}
                                width="45"
                                height="45"
                                alt=""
                              />
                            </div>
                            <div className="ml-1">
                              <h4 className="title text-sm">{row.user_name}</h4>
                              <p className="sub-title2 text-xs">{row.user_email}</p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="dAdmin_info_name min-w-250px">
                            <p>{row.course_title}</p>
                          </div>
                        </td>
                        <td>
                          <p>
                            {row.entry_date
                              ? new Date(row.entry_date * 1000).toLocaleDateString()
                              : ''}
                          </p>
                        </td>
                        <td>
                          {row.expiry_date ? (
                            <p>{new Date(row.expiry_date).toLocaleDateString()}</p>
                          ) : (
                            <span className="inline-block text-xs font-medium px-2 py-0.5 rounded bg-green-500 text-white">
                              {translate('Lifetime access')}
                            </span>
                          )}
                        </td>
                        <td>
                          <button
                            className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200 ol-icon-btn"
                            type="button"
                            title={translate('Delete')}
                            onClick={() =>
                              setConfirmModal({
                                open: true,
                                onConfirm: () => handleDelete(row.id),
                              })
                            }
                          >
                            <i className="fi-rr-trash" />
                          </button>
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

      <ConfirmModal
        isOpen={confirmModal.open}
        onClose={() => setConfirmModal({ open: false })}
        onConfirm={confirmModal.onConfirm}
      />
    </>
  );
}
