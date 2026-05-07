export default function ConfirmModal({ open, isOpen, title = 'Confirm', message, onConfirm, onCancel, onClose, confirmText = 'Confirm', cancelText = 'Cancel', loading = false }) {
  if (!(open ?? isOpen)) return null;
  const cancel = onCancel || onClose;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        {message && <p className="text-sm text-gray-600 mb-4">{message}</p>}
        <div className="flex justify-end gap-2">
          <button className="px-4 py-2 text-sm border rounded-md" onClick={cancel} disabled={loading}>{cancelText}</button>
          <button className="px-4 py-2 text-sm bg-red-600 text-white rounded-md disabled:opacity-50" onClick={onConfirm} disabled={loading}>{loading ? '…' : confirmText}</button>
        </div>
      </div>
    </div>
  );
}
