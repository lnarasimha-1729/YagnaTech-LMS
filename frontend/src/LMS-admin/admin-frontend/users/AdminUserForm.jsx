/**
 * AdminUserForm — create/edit admin or instructor user with 4-tab layout.
 * Ports create_instructor/edit_instructor + partials, and create_admin/edit_admin.
 */

import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import PropTypes from 'prop-types';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useApi } from '@/hooks/useApi';
import { useSettings } from '@/contexts/SettingsContext';
import { API } from '@/config/routes';

const TABS = [
  { key: 'basic', label: 'Basic', icon: 'fi-rr-duplicate' },
  { key: 'login', label: 'Login Credentials', icon: 'fi-rr-key' },
  { key: 'payment', label: 'Payment Information', icon: 'fi-rr-credit-card' },
  { key: 'social', label: 'Social Links', icon: 'fi-rr-link' },
];

function parseKeys(raw) {
  if (!raw) return null;
  if (typeof raw === 'object') return raw;
  try { return JSON.parse(raw); } catch { return null; }
}

export default function AdminUserForm({ userType = 'admin' }) {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { translate, getImage } = useSettings();
  const { get, post } = useApi();

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [gateways, setGateways] = useState([]);
  const [photoPreview, setPhotoPreview] = useState(null);

  const { register, handleSubmit, reset, watch } = useForm({
    defaultValues: {
      name: '',
      about: '',
      phone: '',
      address: '',
      email: '',
      email_verified: false,
      password: '',
      facebook: '',
      twitter: '',
      linkedin: '',
      paymentkeys: {},
    },
  });

  const listEndpoint = userType === 'admin' ? API.ADMIN_ADMINS : API.ADMIN_INSTRUCTORS;
  const itemEndpoint = userType === 'admin' ? API.ADMIN_ADMIN(id) : API.ADMIN_INSTRUCTOR(id);
  const listRoute = `/admin/${userType}s`;
  const typeLabel = userType === 'admin' ? 'Admin' : 'Instructor';
  const title = isEdit ? translate(`Edit ${typeLabel}`) : translate(`Create ${typeLabel}`);

  const fetchData = useCallback(async () => {
    try {
      const [gwRes, userRes] = await Promise.all([
        get(API.ADMIN_PAYMENT_GATEWAYS, { params: { status: 1 } }).catch(() => null),
        isEdit ? get(itemEndpoint) : Promise.resolve(null),
      ]);
      setGateways(gwRes?.data || gwRes || []);

      if (userRes) {
        const data = userRes.data || userRes;
        const user = data.user || data;
        reset({
          name: user.name || '',
          about: user.about || '',
          phone: user.phone || '',
          address: user.address || '',
          email: user.email || '',
          email_verified: Boolean(user.email_verified_at),
          password: '',
          facebook: user.facebook || '',
          twitter: user.twitter || '',
          linkedin: user.linkedin || '',
          paymentkeys: parseKeys(user.paymentkeys) || {},
        });
        if (user.photo) setPhotoPreview(getImage ? getImage(user.photo) : user.photo);
      }
    } catch {
      toast.error(translate('Failed to load user data'));
    } finally {
      setLoading(false);
    }
  }, [get, isEdit, itemEndpoint, reset, getImage, translate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const photoField = watch('photo');
  useEffect(() => {
    if (photoField?.[0]) setPhotoPreview(URL.createObjectURL(photoField[0]));
  }, [photoField]);

  const onSubmit = async (values) => {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', values.name || '');
      fd.append('about', values.about || '');
      fd.append('phone', values.phone || '');
      fd.append('address', values.address || '');
      fd.append('email', values.email || '');
      fd.append('email_verified', values.email_verified ? '1' : '0');
      if (!isEdit && values.password) fd.append('password', values.password);
      fd.append('facebook', values.facebook || '');
      fd.append('twitter', values.twitter || '');
      fd.append('linkedin', values.linkedin || '');
      if (values.photo?.[0]) fd.append('photo', values.photo[0]);

      if (values.paymentkeys && typeof values.paymentkeys === 'object') {
        Object.entries(values.paymentkeys).forEach(([gw, keys]) => {
          if (keys && typeof keys === 'object') {
            Object.entries(keys).forEach(([key, val]) => {
              fd.append(`paymentkeys[${gw}][${key}]`, val ?? '');
            });
          }
        });
      }

      if (isEdit) fd.append('_method', 'PUT');

      await post(isEdit ? itemEndpoint : listEndpoint, fd);
      toast.success(translate(isEdit ? 'User updated' : 'User created'));
      navigate(listRoute);
    } catch {
      toast.error(translate('Failed to save'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <div className="bg-white border border-gray-100 rounded-lg mb-4">
        <div className="flex items-center justify-between px-5 py-3 flex-wrap gap-3">
          <h4 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <i className="fi-rr-settings-sliders" />
            {title}
          </h4>
          <Link
            to={listRoute}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <span className="fi-rr-arrow-alt-left" />
            <span>{translate('Back')}</span>
          </Link>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-lg p-6">
        <h4 className="text-base font-semibold text-gray-900 mb-5">
          {translate(`${typeLabel} Info`)}
        </h4>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="flex flex-col md:flex-row gap-6">
            <aside className="md:w-56 shrink-0">
              <div className="flex md:flex-col gap-2" role="tablist">
                {TABS.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setActiveTab(t.key)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                      activeTab === t.key
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span className={t.icon} />
                    <span>{translate(t.label)}</span>
                  </button>
                ))}
              </div>
            </aside>

            <div className="flex-1 min-w-0">
              {activeTab === 'basic' && (
                <div className="space-y-4">
                  <Field label={translate('Name')} required>
                    <input
                      className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      type="text"
                      required
                      {...register('name')}
                    />
                  </Field>
                  <Field label={translate('Biography')}>
                    <textarea
                      className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      rows="3"
                      {...register('about')}
                    />
                  </Field>
                  <Field label={translate('Phone')}>
                    <input
                      className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      type="text"
                      {...register('phone')}
                    />
                  </Field>
                  <Field label={translate('Address')}>
                    <input
                      className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      type="text"
                      {...register('address')}
                    />
                  </Field>
                  <Field label={translate('User image')}>
                    {photoPreview && (
                      <img
                        src={photoPreview}
                        alt=""
                        className="mb-2 w-24 h-24 rounded-lg object-cover border border-gray-200"
                      />
                    )}
                    <input
                      className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                      type="file"
                      accept="image/*"
                      {...register('photo')}
                    />
                  </Field>
                </div>
              )}

              {activeTab === 'login' && (
                <div className="space-y-4">
                  <Field label={translate('Email')} required>
                    <input
                      className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      type="email"
                      required
                      {...register('email')}
                    />
                  </Field>
                  <Field label="">
                    <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                      <input type="checkbox" {...register('email_verified')} className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 rounded border-gray-300" />
                      {translate('Mark email as verified')}
                    </label>
                  </Field>
                  {!isEdit && (
                    <Field label={translate('Password')} required>
                      <input
                        className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        type="password"
                        required
                        {...register('password')}
                      />
                    </Field>
                  )}
                </div>
              )}

              {activeTab === 'payment' && (
                <div className="space-y-5">
                  {gateways.length === 0 && (
                    <p className="text-sm text-gray-500">{translate('No payment gateways configured')}</p>
                  )}
                  {gateways.map((gw) => {
                    const gwKeys = parseKeys(gw.keys);
                    const hasKeys = gwKeys && typeof gwKeys === 'object' && Object.keys(gwKeys).length > 0;
                    return (
                      <div key={gw.identifier} className="border-b border-gray-200 pb-5 last:border-0">
                        <p className="font-semibold text-gray-900 mb-3">{gw.title}</p>
                        {hasKeys ? (
                          <div className="space-y-3">
                            {Object.keys(gwKeys).map((key) => (
                              <Field key={key} label={translate(key.replace(/_/g, ' '))} capitalize>
                                <input
                                  className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                  type="text"
                                  {...register(`paymentkeys.${gw.identifier}.${key}`)}
                                />
                              </Field>
                            ))}
                          </div>
                        ) : (
                          <div className="rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 px-4 py-3 text-sm">
                            {translate('No API required')}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {activeTab === 'social' && (
                <div className="space-y-4">
                  {['facebook', 'twitter', 'linkedin'].map((net) => (
                    <Field key={net} label={translate(net.charAt(0).toUpperCase() + net.slice(1))}>
                      <input
                        className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        type="text"
                        {...register(net)}
                      />
                    </Field>
                  ))}
                </div>
              )}

              <div className="pt-6">
                <button
                  type="submit"
                  className="inline-flex items-center px-5 py-2.5 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                  disabled={saving}
                >
                  {saving ? translate('Saving...') : (isEdit ? translate(`Update ${typeLabel}`) : translate(`Create ${typeLabel}`))}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}

AdminUserForm.propTypes = {
  userType: PropTypes.oneOf(['admin', 'instructor', 'student']),
};

function Field({ label, required, capitalize, children }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 md:items-center">
      <label className={`md:col-span-3 text-sm font-medium text-gray-700 ${capitalize ? 'capitalize' : ''}`}>
        {label}
        {required && <span className="text-rose-500 ml-1">*</span>}
      </label>
      <div className="md:col-span-9">{children}</div>
    </div>
  );
}

Field.propTypes = {
  label: PropTypes.node,
  required: PropTypes.bool,
  capitalize: PropTypes.bool,
  children: PropTypes.node,
};
