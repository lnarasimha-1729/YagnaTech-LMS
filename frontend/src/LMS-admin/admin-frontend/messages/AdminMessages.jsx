/**
 * AdminMessages - Private message inbox for admin.
 *
 * ============================================================================
 * ORIGINAL BLADE:
 *   resources/views/admin/message/message.blade.php
 *   resources/views/admin/message/message_left_side_bar.blade.php
 *   resources/views/admin/message/message_body.blade.php
 *   resources/views/admin/message/message_new.blade.php
 * ============================================================================
 *
 * Two-column inbox:
 *   Left:  thread list with search + "new conversation" button.
 *   Right: active thread's messages + reply composer, or empty state.
 *
 * Active thread is driven by the URL (?thread=<code>), so deep links work.
 * Reuses the same pattern on the student side (Messages.jsx).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import NoData from '@/components/common/NoData';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';

export default function AdminMessages() {
  const { translate, getImage } = useSettings();
  const { user } = useAuth();
  const { get, post } = useApi();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCode = searchParams.get('thread') || '';

  const [loadingThreads, setLoadingThreads] = useState(true);
  const [threads, setThreads] = useState([]);
  const [search, setSearch] = useState('');
  const [activeThread, setActiveThread] = useState(null);
  const [loadingThread, setLoadingThread] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  const [newModal, setNewModal] = useState(false);
  const [users, setUsers] = useState([]);
  const [receiverId, setReceiverId] = useState('');
  const [creatingThread, setCreatingThread] = useState(false);

  const bodyRef = useRef(null);

  const fetchThreads = useCallback(async () => {
    try {
      const qs = search ? `?search=${encodeURIComponent(search)}` : '';
      const res = await get(`/api/admin/messages${qs}`);
      const data = res.data || res;
      setThreads(data.threads || data.data || data || []);
    } catch {
      toast.error(translate('Failed to load messages'));
    } finally {
      setLoadingThreads(false);
    }
  }, [get, search, translate]);

  useEffect(() => { fetchThreads(); }, [fetchThreads]);

  const fetchThread = useCallback(async (code) => {
    if (!code) { setActiveThread(null); return; }
    setLoadingThread(true);
    try {
      const res = await get(`/api/admin/messages/${code}`);
      const data = res.data || res;
      setActiveThread(data.thread || data);
    } catch {
      toast.error(translate('Failed to load thread'));
    } finally {
      setLoadingThread(false);
    }
  }, [get, translate]);

  useEffect(() => { fetchThread(activeCode); }, [activeCode, fetchThread]);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [activeThread]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeThread) return;
    setSending(true);
    try {
      await post('/api/admin/messages/send', {
        thread_id: activeThread.id,
        receiver_id: activeThread.user?.id,
        message: newMessage,
      });
      setNewMessage('');
      fetchThread(activeCode);
      fetchThreads();
    } catch {
      toast.error(translate('Failed to send'));
    } finally {
      setSending(false);
    }
  };

  const openNewModal = async () => {
    setNewModal(true);
    try {
      const res = await get('/api/admin/messages/users');
      const data = res.data || res;
      setUsers(data.users || data.data || data || []);
    } catch {
      /* ignore */
    }
  };

  const createThread = async (e) => {
    e.preventDefault();
    if (!receiverId) {
      toast.error(translate('Select a user'));
      return;
    }
    setCreatingThread(true);
    try {
      const res = await post('/api/admin/messages/thread', { receiver_id: receiverId });
      const data = res.data || res;
      const code = data.code || data.thread?.code;
      setNewModal(false);
      setReceiverId('');
      fetchThreads();
      if (code) setSearchParams({ thread: code });
    } catch {
      toast.error(translate('Failed to create thread'));
    } finally {
      setCreatingThread(false);
    }
  };

  return (
    <>
      <div className="ol-card radius-8px">
        <div className="ol-card-body py-12px px-20px my-3">
          <h4 className="title text-base mb-0">
            <i className="fi-rr-comment-alt mr-2" />
            {translate('Private Message')}
          </h4>
        </div>
      </div>

      <div className="flex flex-wrap -mx-3 g-4">
        <div className="col-xl-5 w-full lg:w-1/2 w-full md:w-5/12">
          <div className="message-sidebar-area ol-card p-3">
            <div className="message-sidebar-header">
              <div className="flex items-center justify-between mb-3">
                <p className="title text-base mb-0">{translate('Chat List')}</p>
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200 ol-icon-btn ol-icon-btn-sm"
                  title={translate('New message')}
                  onClick={openNewModal}
                >
                  <span className="fi-rr-plus" />
                </button>
              </div>
              <div className="message-sidebar-search mb-3">
                <input
                  className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  type="search"
                  placeholder={translate('Search Here')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {loadingThreads ? (
              <LoadingSpinner />
            ) : threads.length === 0 ? (
              <NoData />
            ) : (
              <ul className="message-sidebar-messages list-none">
                {threads.map((thread) => {
                  const last = thread.last_message || {};
                  const unread = thread.unread_count || 0;
                  const isActive = thread.code === activeCode;
                  return (
                    <li key={thread.id}>
                      <button
                        type="button"
                        className={`message-sidebar-message w-full text-left border-0 bg-transparent p-2${isActive ? 'active' : ''}`}
                        onClick={() => setSearchParams({ thread: thread.code })}
                      >
                        <div className="flex gap-2">
                          <div className="user">
                            <img src={getImage(thread.user?.photo)} alt="" style={{ width: 40, height: 40, borderRadius: '50%' }} />
                          </div>
                          <div className="details flex justify-between flex-grow">
                            <div className="name-message">
                              <h6 className="name mb-0">{thread.user?.name || ''}</h6>
                              <p className="message ellipsis-line-2 text-gray-500 text-xs mb-0">
                                {last.message ? String(last.message).slice(0, 120) : ''}
                              </p>
                            </div>
                            <div className="time text-right">
                              {unread > 0 && <span className="inline-block text-xs font-medium px-2 py-0.5 rounded bg-red-500">{unread}</span>}
                              <p className="mt-1 fs-11px mb-0">{last.time_ago || ''}</p>
                            </div>
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <div className="col-xl-7 w-full lg:w-1/2 w-full md:w-7/12">
          {loadingThread ? (
            <LoadingSpinner />
          ) : !activeThread ? (
            <NoData />
          ) : (
            <div className="messenger-area ol-card p-3">
              <div className="messenger-header flex items-center justify-between pb-3 border-b border-gray-200">
                <div className="user-wrap flex items-center gap-2">
                  <img src={getImage(activeThread.user?.photo)} alt="" style={{ width: 40, height: 40, borderRadius: '50%' }} />
                  <div>
                    <h6 className="name mb-0">{activeThread.user?.name}</h6>
                    <span className="text-xs text-gray-500">{activeThread.user?.email}</span>
                  </div>
                </div>
              </div>

              <ul
                ref={bodyRef}
                className="messenger-body list-none my-3"
                style={{ maxHeight: 500, overflowY: 'auto' }}
              >
                {(activeThread.messages || []).map((m) => {
                  const mine = m.sender_id === user?.id;
                  const who = mine ? user : activeThread.user;
                  return (
                    <li key={m.id} className="mb-3">
                      <div className={`single-message${mine ? 'recipient-user' : ''}`}>
                        <div className="user-wrap flex items-center mb-2 gap-2">
                          <img src={getImage(who?.photo)} alt="" style={{ width: 30, height: 30, borderRadius: '50%' }} />
                          <div className="flex items-center flex-wrap gap-2">
                            <h6 className="name mb-0 fs-13px">{who?.name}</h6>
                            <p className="time mb-0 fs-11px text-gray-500">{m.time_ago || ''}</p>
                          </div>
                        </div>
                        <p className="message mb-0">{m.message}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <form className="messenger-footer" onSubmit={sendMessage}>
                <div className="messenger-footer-inner flex items-center gap-2">
                  <input
                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    type="text"
                    placeholder={translate('Type your message here...')}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                  />
                  <button
                    className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-2"
                    type="submit"
                    disabled={sending || !newMessage.trim()}
                  >
                    <span className="fi-rr-rocket" />
                    <span>{sending ? translate('Sending...') : translate('Send')}</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {newModal && (
        <div
          className="modal fade show block"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={(e) => e.target === e.currentTarget && setNewModal(false)}
        >
          <div className="mx-auto flex items-center justify-center">
            <div className="bg-white rounded-2xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h5 className="text-base font-semibold text-gray-900">{translate('Create a new thread')}</h5>
                <button type="button" className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100" onClick={() => setNewModal(false)} />
              </div>
              <form onSubmit={createThread}>
                <div className="px-6 py-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 block text-sm font-medium text-gray-700 mb-1.5">{translate('Select a new user')}</label>
                  <select
                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={receiverId}
                    onChange={(e) => setReceiverId(e.target.value)}
                  >
                    <option value="">{translate('Select a user')}</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100">
                  <button type="button" className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-gray-500 text-white hover:bg-gray-600" onClick={() => setNewModal(false)}>
                    {translate('Cancel')}
                  </button>
                  <button type="submit" className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-indigo-600 text-white hover:bg-indigo-700" disabled={creatingThread}>
                    {creatingThread ? translate('...') : translate('Next')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
