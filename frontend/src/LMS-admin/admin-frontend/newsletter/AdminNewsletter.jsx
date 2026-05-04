/**
 * AdminNewsletter - Admin newsletter management (create/edit/send/delete).
 *
 * ============================================================================
 * ORIGINAL BLADE: resources/views/admin/newsletter/index.blade.php
 *                 resources/views/admin/newsletter/create.blade.php
 *                 resources/views/admin/newsletter/edit.blade.php
 *                 resources/views/admin/newsletter/send.blade.php
 * ============================================================================
 *
 * Accordion list of newsletters. Each item has action icons: send, edit,
 * delete. Send modal chooses recipient group (all registered / subscribers).
 */

import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import NoData from '@/components/common/NoData';
import ConfirmModal from '@/components/common/ConfirmModal';
import Modal from '@/components/common/Modal';
import { useApi } from '@/hooks/useApi';
import { useSettings } from '@/contexts/SettingsContext';
import { API } from '@/config/routes';

export default function AdminNewsletter() {
  const { translate } = useSettings();
  const { get, post, put, del } = useApi();

  const [newsletters, setNewsletters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(null); // newsletter being sent
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ open: false });
  const [recipientType, setRecipientType] = useState('subscribers');

  const { register, handleSubmit, reset } = useForm();

  const fetchNewsletters = useCallback(async () => {
    setLoading(true);
    try {
      const res = await get(API.ADMIN_NEWSLETTER);
      setNewsletters(res.data || res || []);
    } catch {
      toast.error(translate('Failed to load newsletters'));
    } finally {
      setLoading(false);
    }
  }, [get, translate]);

  useEffect(() => {
    fetchNewsletters();
  }, [fetchNewsletters]);

  const openCreate = () => {
    setEditing(null);
    reset({ subject: '', description: '' });
    setModalOpen(true);
  };

  const openEdit = (n) => {
    setEditing(n);
    reset({ subject: n.subject, description: n.description });
    setModalOpen(true);
  };

  const onSubmit = async (values) => {
    setSaving(true);
    try {
      if (editing) {
        await put(API.ADMIN_NEWSLETTER_ITEM(editing.id), values);
        toast.success(translate('Newsletter updated'));
      } else {
        await post(API.ADMIN_NEWSLETTER, values);
        toast.success(translate('Newsletter added'));
      }
      setModalOpen(false);
      fetchNewsletters();
    } catch {
      toast.error(translate('Failed to save'));
    } finally {
      setSaving(false);
    }
  };

  const sendNewsletter = async () => {
    if (!sendOpen) return;
    setSending(true);
    try {
      await post(API.ADMIN_NEWSLETTER_SEND(sendOpen.id), { type: recipientType });
      toast.success(translate('Newsletter sent'));
      setSendOpen(null);
    } catch {
      toast.error(translate('Failed to send'));
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await del(API.ADMIN_NEWSLETTER_ITEM(id));
      toast.success(translate('Newsletter deleted'));
      fetchNewsletters();
    } catch {
      toast.error(translate('Failed to delete'));
    }
    setConfirmModal({ open: false });
  };

  return (
    <>
      <div className="bg-white border border-gray-100 rounded-lg">
        <div className="py-3 px-5 my-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h4 className="title text-base">
              <i className="fi-rr-settings-sliders mr-2" />
              {translate('Newsletter')}
            </h4>
            <button
              className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors border border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center cg-10px"
              type="button"
              onClick={openCreate}
            >
              <span className="fi-rr-plus" />
              <span>{translate('Add Newsletter')}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap">
        <div className="w-full">
          <div className="bg-white border border-gray-100 rounded-lg p-5">
            <div className="">
              {loading ? (
                <LoadingSpinner />
              ) : newsletters.length === 0 ? (
                <NoData />
              ) : (
                <ul className="list-none mb-0">
                  {newsletters.map((n, idx) => (
                    <li className="border-b border-gray-200 py-3" key={n.id}>
                      <div className="flex justify-between items-center">
                        <button
                          className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors text-emerald-600 hover:text-emerald-700 text-left no-underline text-reset flex-grow"
                          type="button"
                          onClick={() =>
                            setExpandedId(expandedId === n.id ? null : n.id)
                          }
                        >
                          <h4 className="title text-sm mb-0">
                            {idx + 1}. {n.subject}
                          </h4>
                        </button>
                        <div className="flex gap-2">
                          <button
                            className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors text-sm text-emerald-600 hover:text-emerald-700 text-emerald-600"
                            type="button"
                            title={translate('Send Newsletter')}
                            onClick={() => {
                              setRecipientType('subscribers');
                              setSendOpen(n);
                            }}
                          >
                            <span className="fi-rr-paper-plane" />
                          </button>
                          <button
                            className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors text-sm text-emerald-600 hover:text-emerald-700 text-gray-500"
                            type="button"
                            title={translate('Edit')}
                            onClick={() => openEdit(n)}
                          >
                            <span className="fi fi-rr-pen-clip" />
                          </button>
                          <button
                            className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors text-sm text-emerald-600 hover:text-emerald-700 text-red-600"
                            type="button"
                            title={translate('Delete')}
                            onClick={() =>
                              setConfirmModal({
                                open: true,
                                onConfirm: () => handleDelete(n.id),
                              })
                            }
                          >
                            <span className="fi-rr-trash" />
                          </button>
                        </div>
                      </div>
                      {expandedId === n.id && (
                        <div
                          className="py-2 mt-2 text-sm"
                          dangerouslySetInnerHTML={{ __html: n.description || '' }}
                        />
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create / Edit modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? translate('Edit Newsletter') : translate('Add Newsletter')}
        size="lg"
        footer={null}
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {translate('Subject')}
            </label>
            <input
              className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              type="text"
              {...register('subject', { required: true })}
            />
          </div>
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {translate('Description')}
            </label>
            <textarea
              className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              rows="10"
              {...register('description', { required: true })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 -mx-6 px-6">
            <button
              className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors border border-gray-300 text-gray-700 hover:bg-gray-50"
              type="button"
              onClick={() => setModalOpen(false)}
            >
              {translate('Cancel')}
            </button>
            <button className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-emerald-600 text-white hover:bg-emerald-700" type="submit" disabled={saving}>
              {saving ? translate('Saving...') : translate('Save')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Send modal */}
      <Modal
        isOpen={!!sendOpen}
        onClose={() => setSendOpen(null)}
        title={translate('Send newsletter')}
        footer={(
          <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100">
            <button
              className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors border border-gray-300 text-gray-700 hover:bg-gray-50"
              type="button"
              onClick={() => setSendOpen(null)}
            >
              {translate('Cancel')}
            </button>
            <button
              className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-emerald-600 text-white hover:bg-emerald-700"
              type="button"
              onClick={sendNewsletter}
              disabled={sending}
            >
              {sending ? translate('Sending...') : translate('Send')}
            </button>
          </div>
        )}
      >
        {sendOpen && (
          <>
            <p className="mb-3">
              <strong>{sendOpen.subject}</strong>
            </p>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {translate('Recipient group')}
              </label>
              <select
                className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={recipientType}
                onChange={(e) => setRecipientType(e.target.value)}
              >
                <option value="subscribers">
                  {translate('Newsletter subscribers')}
                </option>
                <option value="registered">
                  {translate('All registered users')}
                </option>
              </select>
            </div>
          </>
        )}
      </Modal>

      <ConfirmModal
        isOpen={confirmModal.open}
        onClose={() => setConfirmModal({ open: false })}
        onConfirm={confirmModal.onConfirm}
      />
    </>
  );
}
