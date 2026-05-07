/**
 * AdminContacts - Admin contact message inbox with reply modal.
 *
 * ============================================================================
 * ORIGINAL BLADE: resources/views/admin/contact/index.blade.php
 *                 resources/views/admin/contact/reply.blade.php
 * ============================================================================
 *
 * Paginated table of contact messages (name, email/phone/address, message).
 * Reply sends an email via backend; delete removes the message.
 */

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import NoData from '@/components/common/NoData';
import Pagination from '@/components/common/Pagination';
import ConfirmModal from '@/components/common/ConfirmModal';
import { useApi } from '@/hooks/useApi';
import { useSettings } from '@/contexts/SettingsContext';
import { API } from '@/config/routes';

export default function AdminContacts() {
  const { translate } = useSettings();
  const { get, post, del } = useApi();
  const [searchParams, setSearchParams] = useSearchParams();

  const [contacts, setContacts] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replyOpen, setReplyOpen] = useState(null);
  const [replying, setReplying] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ open: false });
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');

  const { register, handleSubmit, reset } = useForm();

  const page = searchParams.get('page') || '1';
  const search = searchParams.get('search') || '';

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page };
      if (search) params.search = search;
      const res = await get(API.ADMIN_CONTACTS, { params });
      setContacts(res.data || []);
      setMeta(res.meta || null);
    } catch {
      toast.error(translate('Failed to load contacts'));
    } finally {
      setLoading(false);
    }
  }, [get, page, search, translate]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const onSearch = (e) => {
    e.preventDefault();
    const next = new URLSearchParams(searchParams);
    if (searchInput) next.set('search', searchInput);
    else next.delete('search');
    next.delete('page');
    setSearchParams(next);
  };

  const openReply = (c) => {
    reset({ subject: `Re: ${c.subject || translate('Your message')}`, message: '' });
    setReplyOpen(c);
  };

  const onReplySubmit = async (values) => {
    setReplying(true);
    try {
      await post(API.ADMIN_CONTACT_REPLY(replyOpen.id), values);
      toast.success(translate('Reply sent'));
      setReplyOpen(null);
    } catch {
      toast.error(translate('Failed to send reply'));
    } finally {
      setReplying(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await del(API.ADMIN_CONTACT(id));
      toast.success(translate('Contact deleted'));
      fetchContacts();
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
            <span>{translate('Contacts')}</span>
          </h4>
        </div>
      </div>

      <div className="flex flex-wrap -mx-3">
        <div className="w-full">
          <div className="ol-card">
            <div className="ol-card-body p-3">
              <div className="flex flex-wrap -mx-3 row-gap-3 mb-3 mt-3">
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
                          placeholder={translate('Search Contact')}
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
              ) : contacts.length === 0 ? (
                <NoData />
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="eTable eTable-2 w-full">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>{translate('Name')}</th>
                          <th>{translate('Contact')}</th>
                          <th>{translate('Message')}</th>
                          <th>{translate('Options')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {contacts.map((c, idx) => (
                          <tr key={c.id}>
                            <td>{(meta?.from || 1) + idx}</td>
                            <td>
                              <h4 className="title text-sm">{c.name}</h4>
                              <p>
                                <span
                                  className={`inline-block text-xs font-medium px-2 py-0.5 rounded${ c.is_registered ? 'bg-success' : 'bg-danger' }`}
                                >
                                  {translate(c.is_registered ? 'Registered' : 'Not registered')}
                                </span>
                              </p>
                            </td>
                            <td>
                              <p className="sub-title2 text-xs mb-1">
                                {translate('Email')}: {c.email}
                              </p>
                              {c.phone && (
                                <p className="sub-title2 text-xs mb-1">
                                  {translate('Phone')}: {c.phone}
                                </p>
                              )}
                              {c.address && (
                                <p className="sub-title2 text-xs mb-0">
                                  {translate('Address')}: {c.address}
                                </p>
                              )}
                            </td>
                            <td>
                              <p className="sub-title text-xs">{c.message}</p>
                            </td>
                            <td>
                              <div className="relative ol-icon-dropdown">
                                <button
                                  className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200"
                                  type="button"
                                  data-bs-toggle="dropdown"
                                >
                                  <span className="fi-rr-menu-dots-vertical" />
                                </button>
                                <ul className="absolute mt-2 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-30">
                                  <li>
                                    <button
                                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                      type="button"
                                      onClick={() => openReply(c)}
                                    >
                                      {translate('Reply')}
                                    </button>
                                  </li>
                                  <li>
                                    <button
                                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                      type="button"
                                      onClick={() =>
                                        setConfirmModal({
                                          open: true,
                                          onConfirm: () => handleDelete(c.id),
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

      {/* Reply modal */}
      {replyOpen && (
        <div
          className="modal fade show block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className="mx-auto flex items-center justify-center modal-lg">
            <div className="bg-white rounded-2xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h5 className="text-base font-semibold text-gray-900">{translate('Message Reply')}</h5>
                <button
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100"
                  type="button"
                  onClick={() => setReplyOpen(null)}
                />
              </div>
              <form onSubmit={handleSubmit(onReplySubmit)}>
                <div className="px-6 py-4">
                  <p className="mb-2 text-gray-500">
                    {translate('To')}: {replyOpen.name} &lt;{replyOpen.email}&gt;
                  </p>
                  <div className="fpb-7 mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5 block text-sm font-medium text-gray-700 mb-1.5">
                      {translate('Subject')}
                    </label>
                    <input
                      className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      type="text"
                      {...register('subject', { required: true })}
                    />
                  </div>
                  <div className="fpb-7 mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5 block text-sm font-medium text-gray-700 mb-1.5">
                      {translate('Message')}
                    </label>
                    <textarea
                      className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      rows="8"
                      {...register('message', { required: true })}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100">
                  <button
                    className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors border border-gray-300 text-gray-700 hover:bg-gray-50"
                    type="button"
                    onClick={() => setReplyOpen(null)}
                  >
                    {translate('Cancel')}
                  </button>
                  <button
                    className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-indigo-600 text-white hover:bg-indigo-700"
                    type="submit"
                    disabled={replying}
                  >
                    {replying ? translate('Sending...') : translate('Send reply')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.open}
        onClose={() => setConfirmModal({ open: false })}
        onConfirm={confirmModal.onConfirm}
      />
    </>
  );
}
