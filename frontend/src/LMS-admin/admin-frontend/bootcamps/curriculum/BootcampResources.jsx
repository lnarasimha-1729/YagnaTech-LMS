/**
 * BootcampResources — port of admin/bootcamp_resource/index.blade.php.
 * Upload type select + multi-file input + list of existing files with download/delete.
 */

import { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import ConfirmModal from '@/components/common/ConfirmModal';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useApi } from '@/hooks/useApi';
import { useSettings } from '@/contexts/SettingsContext';
import { API } from '@/config/routes';

const inputClass =
  'w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent';
const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5';

export default function BootcampResources({ moduleId, onClose }) {
  const { translate } = useSettings();
  const { get, post, del } = useApi();

  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [confirm, setConfirm] = useState({ open: false });

  const { register, handleSubmit, reset } = useForm({
    defaultValues: { upload_type: '', files: null },
  });

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await get(API.ADMIN_BOOTCAMP_RESOURCES(moduleId));
      setFiles(res.data || res || []);
    } catch {
      toast.error(translate('Failed to load files'));
    } finally {
      setLoading(false);
    }
  }, [get, moduleId, translate]);

  useEffect(() => { fetchFiles(); }, [fetchFiles]);

  const onUpload = async (values) => {
    const list = values.files;
    if (!list || list.length === 0) {
      toast.error(translate('Please select at least one file'));
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('module_id', moduleId);
      fd.append('upload_type', values.upload_type);
      Array.from(list).forEach((f) => fd.append('files[]', f));
      await post(API.ADMIN_BOOTCAMP_RESOURCES(moduleId), fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success(translate('File uploaded'));
      reset({ upload_type: '', files: null });
      fetchFiles();
    } catch (err) {
      toast.error(err.response?.data?.message || translate('Failed to upload'));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await del(API.ADMIN_BOOTCAMP_RESOURCE(id));
      toast.success(translate('File deleted'));
      fetchFiles();
    } catch {
      toast.error(translate('Failed to delete'));
    } finally {
      setConfirm({ open: false });
    }
  };

  return (
    <div className="space-y-5">
      <form onSubmit={handleSubmit(onUpload)} encType="multipart/form-data" className="space-y-3">
        <div>
          <label className={labelClass} htmlFor="upload_type">
            {translate('Upload File Type')} <span className="text-rose-500">*</span>
          </label>
          <select
            id="upload_type"
            className={inputClass}
            {...register('upload_type', { required: true })}
          >
            <option value="">{translate('Select an option')}</option>
            <option value="resource">{translate('Resource')}</option>
            <option value="record">{translate('Class record')}</option>
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-end">
          <div>
            <label className={labelClass} htmlFor="files">
              {translate('Files')} <span className="text-rose-500">*</span>
            </label>
            <input
              id="files"
              type="file"
              multiple
              className={inputClass}
              {...register('files', { required: true })}
            />
          </div>
          <button
            type="submit"
            disabled={uploading}
            className="px-5 py-2 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {uploading ? translate('Uploading...') : translate('Upload')}
          </button>
        </div>
      </form>

      <div>
        {loading ? (
          <LoadingSpinner />
        ) : files.length === 0 ? (
          <p className="text-sm text-gray-500 py-3">{translate('No files uploaded yet.')}</p>
        ) : (
          <>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">{translate('Resource files')}</h4>
            <ul className="divide-y divide-gray-100 border border-gray-100 rounded-lg">
              {files.map((f) => (
                <li key={f.id} className="flex items-center justify-between px-3 py-2 text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`inline-block text-xs font-medium px-2 py-0.5 rounded text-white ${
                        f.upload_type === 'resource' ? 'bg-emerald-600' : 'bg-indigo-600'
                      }`}
                    >
                      {f.upload_type
                        ? f.upload_type.charAt(0).toUpperCase() + f.upload_type.slice(1)
                        : ''}
                    </span>
                    <p className="truncate text-gray-800" title={f.title}>{f.title}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <a
                      href={API.ADMIN_BOOTCAMP_RESOURCE_DOWNLOAD(f.id)}
                      target="_blank"
                      rel="noreferrer"
                      className="w-8 h-8 inline-flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600"
                      title={translate('Download')}
                    >
                      <i className="fi fi-rr-down-to-line" />
                    </a>
                    <button
                      type="button"
                      onClick={() => setConfirm({ open: true, id: f.id })}
                      className="w-8 h-8 inline-flex items-center justify-center rounded-lg hover:bg-rose-50 hover:text-rose-600 text-gray-600"
                      title={translate('Delete')}
                    >
                      <i className="fi-rr-trash" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {onClose && (
        <div className="flex justify-end pt-3 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            {translate('Close')}
          </button>
        </div>
      )}

      <ConfirmModal
        isOpen={confirm.open}
        onClose={() => setConfirm({ open: false })}
        onConfirm={() => handleDelete(confirm.id)}
        title={translate('Delete this file?')}
        message={translate("You can't bring it back!")}
      />
    </div>
  );
}

BootcampResources.propTypes = {
  moduleId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onClose: PropTypes.func,
};

BootcampResources.defaultProps = {
  onClose: undefined,
};
