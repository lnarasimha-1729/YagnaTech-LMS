/**
 * BootcampPurchaseHistory - Admin/instructor bootcamp purchase history list.
 *
 * ============================================================================
 * ORIGINAL BLADE: resources/views/admin/bootcamp/purchase_history.blade.php
 * ============================================================================
 */

import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Pagination from '@/components/common/Pagination';
import NoData from '@/components/common/NoData';
import { useApi } from '@/hooks/useApi';
import { useSettings } from '@/contexts/SettingsContext';

export default function BootcampPurchaseHistory({ role = 'admin' }) {
  const { translate, getCurrency, getImage } = useSettings();
  const { get } = useApi();
  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState([]);
  const [pagination, setPagination] = useState(null);

  const prefix = role === 'instructor' ? '/api/instructor' : '/api/admin';

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await get(`${prefix}/bootcamp-purchases?page=${page}`);
      const data = res.data || res;
      setPurchases(data.data || data.purchases || []);
      setPagination(data.meta || data.pagination || null);
    } catch {
      toast.error(translate('Failed to load'));
    } finally {
      setLoading(false);
    }
  }, [get, prefix, translate]);

  useEffect(() => { load(); }, [load]);

  const formatDate = (d) => {
    if (!d) return '';
    return new Date(typeof d === 'number' ? d * 1000 : d)
      .toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
  };

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <div className="ol-card radius-8px">
        <div className="ol-card-body py-12px px-20px my-3 py-4">
          <div className="flex items-center justify-between flex-md-nowrap flex-wrap gap-3">
            <h4 className="title text-base">
              <i className="fi-rr-settings-sliders mr-2" />
              {translate('Purchase History')}
            </h4>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap -mx-3">
        <div className="w-full">
          <div className="ol-card">
            <div className="ol-card-body p-3">
              {purchases.length > 0 ? (
                <>
                  {pagination && (
                    <div className="admin-tInfo-pagi flex justify-content-md-between justify-center items-center gr-15 flex-wrap mb-3">
                      <p className="admin-tInfo">
                        {translate('Showing')} {purchases.length} {translate('of')} {pagination.total || 0} {translate('data')}
                      </p>
                    </div>
                  )}
                  <div className="overflow-x-auto">
                    <table className="eTable eTable-2 w-full">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>{translate('User')}</th>
                          <th>{translate('Bootcamp')}</th>
                          <th>{translate('Price')}</th>
                          <th>{translate('Issue date')}</th>
                          <th>{translate('Payment method')}</th>
                          <th>{translate('Options')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {purchases.map((p, idx) => (
                          <tr key={p.id}>
                            <th scope="row"><p className="row-number">{idx + 1}</p></th>
                            <td>
                              <div className="dAdmin_profile flex items-center min-w-200px">
                                <div className="dAdmin_profile_img">
                                  <img className="img-fluid rounded-full image-45" src={getImage(p.user_photo)} width="40" height="40" alt="" />
                                </div>
                                <div className="ml-1 mt-1">
                                  <h4 className="title text-sm">{p.user_name}</h4>
                                  <p className="sub-title2 text-xs">{p.user_email}</p>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div className="sub-title2 text-xs min-w-150px">
                                {p.title}
                              </div>
                            </td>
                            <td>
                              <div className="sub-title2 text-xs min-w-150px">
                                <p>{getCurrency(p.price)}</p>
                                <p><span>{translate('Admin :')}</span> {getCurrency(p.admin_revenue)}</p>
                                <p><span>{translate('Author :')}</span> {getCurrency(p.instructor_revenue)}</p>
                              </div>
                            </td>
                            <td>
                              <div className="sub-title2 text-xs">
                                <p>{formatDate(p.purchase_date || p.created_at)}</p>
                              </div>
                            </td>
                            <td>
                              <div className="sub-title2 text-xs capitalize">
                                <p>{p.payment_method}</p>
                              </div>
                            </td>
                            <td>
                              <Link
                                className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors border border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center cg-10px"
                                to={`/${role}/bootcamp-purchase-invoice/${p.id}`}
                              >
                                <span>{translate('Invoice')}</span>
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {pagination && (
                    <Pagination
                      current={pagination.current_page}
                      last={pagination.last_page}
                      onChange={(pg) => load(pg)}
                    />
                  )}
                </>
              ) : (
                <NoData message={translate('No purchase data found')} />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
