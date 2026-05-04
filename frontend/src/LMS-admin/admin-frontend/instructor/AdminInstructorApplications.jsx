/**
 * AdminInstructorApplications — port of admin/instructor/application.blade.php
 * and admin/instructor/show_document.blade.php (details modal).
 * Pending / Approved tabs, per-row details modal + document download,
 * dropdown for approve/delete on pending rows.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import NoData from '@/components/common/NoData';
import ConfirmModal from '@/components/common/ConfirmModal';
import Modal from '@/components/common/Modal';
import Pagination from '@/components/common/Pagination';
import { useApi } from '@/hooks/useApi';
import { useSettings } from '@/contexts/SettingsContext';
import { API } from '@/config/routes';

export default function AdminInstructorApplications() {
  const { translate, getImage } = useSettings();
  const { get, post, del } = useApi();

  const [tab, setTab] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);

  const [detailsFor, setDetailsFor] = useState(null);
  const [confirmState, setConfirmState] = useState({ open: false });
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const close = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpenMenuId(null);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const status = tab === 'pending' ? 0 : 1;
      const res = await get(API.ADMIN_INSTRUCTOR_APPLICATIONS, { params: { status, page } });
      const data = res.data ? res : { data: res };
      setItems(data.data || []);
      setMeta(data.meta || res.meta || null);
    } catch {
      toast.error(translate('Failed to load applications'));
    } finally {
      setLoading(false);
    }
  }, [get, tab, page, translate]);

  useEffect(() => { fetchItems(); }, [fetchItems]);
  useEffect(() => { setPage(1); }, [tab]);

  const handleApprove = async (id) => {
    try {
      await post(`${API.ADMIN_INSTRUCTOR_APPLICATIONS}/${id}/approve`, {});
      toast.success(translate('Application approved'));
      fetchItems();
    } catch {
      toast.error(translate('Failed to approve'));
    } finally {
      setConfirmState({ open: false });
    }
  };

  const handleDelete = async (id) => {
    try {
      await del(`${API.ADMIN_INSTRUCTOR_APPLICATIONS}/${id}`);
      toast.success(translate('Application deleted'));
      fetchItems();
    } catch {
      toast.error(translate('Failed to delete'));
    } finally {
      setConfirmState({ open: false });
    }
  };

  const downloadUrl = (id) => `/admin/instructor-applications/${id}/download`;

  const renderTable = (rows, showActions) => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase text-gray-500 border-b border-gray-200">
            <th className="px-3 py-2">#</th>
            <th className="px-3 py-2">{translate('Name')}</th>
            <th className="px-3 py-2">{translate('Details')}</th>
            <th className="px-3 py-2">{translate('Document')}</th>
            <th className="px-3 py-2">{translate('Status')}</th>
            {showActions && <th className="px-3 py-2 text-center">{translate('Action')}</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((app, i) => (
            <tr key={app.id} className="border-b border-gray-100 align-middle">
              <td className="px-3 py-3">{(meta?.from || 1) + i}</td>
              <td className="px-3 py-3 text-gray-900">{app.user?.name || app.name || '—'}</td>
              <td className="px-3 py-3">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700"
                  onClick={() => setDetailsFor(app)}
                >
                  <i className="fa fa-info-circle" />
                  {translate('Application details')}
                </button>
              </td>
              <td className="px-3 py-3">
                <a
                  href={downloadUrl(app.id)}
                  title={translate('Download')}
                  className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
                >
                  <span className="fi-rr-download" />
                </a>
              </td>
              <td className="px-3 py-3">
                {Number(app.status) === 0 ? (
                  <span className="inline-block text-xs font-medium px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                    {translate('Pending')}
                  </span>
                ) : (
                  <span className="inline-block text-xs font-medium px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    {translate('Approved')}
                  </span>
                )}
              </td>
              {showActions && (
                <td className="px-3 py-3 text-center relative">
                  <button
                    type="button"
                    onClick={() => setOpenMenuId(openMenuId === app.id ? null : app.id)}
                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:bg-gray-100"
                  >
                    <span className="fi-rr-menu-dots-vertical" />
                  </button>
                  {openMenuId === app.id && (
                    <ul
                      ref={menuRef}
                      className="absolute right-3 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-30 text-left"
                    >
                      <li>
                        <button
                          type="button"
                          className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => {
                            setOpenMenuId(null);
                            setConfirmState({
                              open: true,
                              title: translate('Approve application'),
                              message: translate('Grant this user instructor access?'),
                              onConfirm: () => handleApprove(app.id),
                            });
                          }}
                        >
                          {translate('Approve')}
                        </button>
                      </li>
                      <li>
                        <button
                          type="button"
                          className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => {
                            setOpenMenuId(null);
                            setConfirmState({
                              open: true,
                              title: translate('Delete application'),
                              message: translate("You can't bring it back!"),
                              onConfirm: () => handleDelete(app.id),
                            });
                          }}
                        >
                          {translate('Delete')}
                        </button>
                      </li>
                    </ul>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <>
      <div className="bg-white border border-gray-100 rounded-lg mb-4">
        <div className="flex items-center justify-between px-5 py-3 flex-wrap gap-3">
          <h4 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <i className="fi-rr-settings-sliders" />
            {translate('Instructor Applications')}
          </h4>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-lg p-4">
        <div className="flex gap-1 border-b border-gray-200">
          {['pending', 'approved'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
                tab === t
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-gray-600 hover:text-emerald-700'
              }`}
            >
              {translate(t === 'pending' ? 'Pending applications' : 'Approved applications')}
            </button>
          ))}
        </div>

        <div className="mt-4">
          {loading ? (
            <LoadingSpinner />
          ) : items.length === 0 ? (
            <NoData message={translate(tab === 'pending' ? 'No pending applications' : 'No approved applications')} />
          ) : (
            <>
              {renderTable(items, tab === 'pending')}
              <Pagination
                meta={meta}
                onPageChange={setPage}
              />
            </>
          )}
        </div>
      </div>

      <Modal
        isOpen={Boolean(detailsFor)}
        onClose={() => setDetailsFor(null)}
        title={translate('Applicant details')}
        size="lg"
        footer={
          <div className="flex items-center justify-end gap-2">
            {detailsFor && (
              <a
                href={downloadUrl(detailsFor.id)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <span className="fi-rr-download" />
                {translate('Download document')}
              </a>
            )}
            <button
              type="button"
              onClick={() => setDetailsFor(null)}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              {translate('Close')}
            </button>
          </div>
        }
      >
        {detailsFor && (
          <div className="space-y-5">
            {detailsFor.user?.photo && (
              <div className="text-center">
                <img
                  src={getImage ? getImage(detailsFor.user.photo) : detailsFor.user.photo}
                  alt=""
                  className="inline-block w-24 h-24 rounded-full object-cover"
                />
              </div>
            )}
            <ul className="divide-y divide-gray-200 text-sm">
              <Row label={translate('Applicant')} value={detailsFor.user?.name} />
              <Row label={translate('Email')} value={detailsFor.user?.email} />
              <Row label={translate('Phone number')} value={detailsFor.user?.phone} />
              <Row label={translate('Address')} value={detailsFor.user?.address} />
              <Row label={translate('Message')} value={detailsFor.description} />
              <li className="py-3 flex justify-between">
                <span className="font-semibold text-gray-900">{translate('Status')}</span>
                {Number(detailsFor.status) === 1 ? (
                  <span className="inline-block text-xs font-medium px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    {translate('Accepted')}
                  </span>
                ) : (
                  <span className="inline-block text-xs font-medium px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                    {translate('Pending')}
                  </span>
                )}
              </li>
            </ul>
          </div>
        )}
      </Modal>

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

function Row({ label, value }) {
  if (!value) return null;
  return (
    <li className="py-3 flex justify-between gap-4">
      <span className="font-semibold text-gray-900">{label}</span>
      <span className="text-gray-600 text-right break-words">{value}</span>
    </li>
  );
}
