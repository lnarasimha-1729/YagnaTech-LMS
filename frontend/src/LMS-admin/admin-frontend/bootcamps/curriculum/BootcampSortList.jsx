/**
 * BootcampSortList — port of admin/bootcamp_module/sort.blade.php + bootcamp_live_class/sort.blade.php.
 * Native HTML5 drag-and-drop ordering. Emits ordered ids back to parent on save.
 */

import { useState } from 'react';
import PropTypes from 'prop-types';
import toast from 'react-hot-toast';
import { useApi } from '@/hooks/useApi';
import { useSettings } from '@/contexts/SettingsContext';

export default function BootcampSortList({ items, sortUrl, extraPayload, onSuccess, onCancel }) {
  const { translate } = useSettings();
  const { post } = useApi();
  const [ordered, setOrdered] = useState(items);
  const [dragId, setDragId] = useState(null);
  const [saving, setSaving] = useState(false);

  const onDragStart = (id) => (e) => {
    setDragId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = (id) => (e) => {
    e.preventDefault();
    if (dragId == null || dragId === id) return;
    setOrdered((prev) => {
      const from = prev.findIndex((x) => x.id === dragId);
      const to = prev.findIndex((x) => x.id === id);
      if (from === -1 || to === -1) return prev;
      const next = prev.slice();
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };

  const onDragEnd = () => setDragId(null);

  const onSave = async () => {
    setSaving(true);
    try {
      await post(sortUrl, {
        ...extraPayload,
        item_ids: ordered.map((x) => x.id),
      });
      toast.success(translate('Order saved'));
      onSuccess?.();
    } catch {
      toast.error(translate('Failed to save order'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {ordered.map((item) => (
          <li
            key={item.id}
            draggable
            onDragStart={onDragStart(item.id)}
            onDragOver={onDragOver(item.id)}
            onDragEnd={onDragEnd}
            className={`flex items-center justify-between px-3 py-2 rounded-lg border cursor-move select-none ${
              dragId === item.id
                ? 'border-emerald-400 bg-emerald-50'
                : 'border-gray-200 bg-white hover:bg-gray-50'
            }`}
          >
            <span className="text-sm font-medium text-gray-800 truncate">{item.title}</span>
            <i className="fi-rr-apps-sort text-gray-400" />
          </li>
        ))}
      </ul>

      <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          {translate('Cancel')}
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="px-5 py-2 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {saving ? translate('Saving...') : translate('Save Changes')}
        </button>
      </div>
    </div>
  );
}

BootcampSortList.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      title: PropTypes.string.isRequired,
    })
  ).isRequired,
  sortUrl: PropTypes.string.isRequired,
  extraPayload: PropTypes.object,
  onSuccess: PropTypes.func,
  onCancel: PropTypes.func,
};

BootcampSortList.defaultProps = {
  extraPayload: {},
  onSuccess: undefined,
  onCancel: undefined,
};
