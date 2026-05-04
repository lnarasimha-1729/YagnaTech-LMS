/**
 * WebsiteSettings - Admin website settings with tabbed sub-sections.
 *
 * ============================================================================
 * ORIGINAL BLADE: resources/views/admin/setting/website_setting.blade.php
 * Sub-templates:
 *   - frontend_setting.blade.php
 *   - motivational.blade.php
 *   - webfaqs.blade.php
 *   - contact_information.blade.php
 *   - recaptcha.blade.php
 *   - user_review_list.blade.php
 *   - logo_image.blade.php
 * ============================================================================
 *
 * 7 tabs:
 *   1. Frontend Settings
 *   2. Motivational Speech (dynamic array)
 *   3. Website FAQs (dynamic array)
 *   4. Contact Information
 *   5. Recaptcha
 *   6. User Reviews (list with edit/delete)
 *   7. Logo & Images (4 upload slots: banner, light logo, dark logo, favicon)
 */

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import NoData from '@/components/common/NoData';
import ConfirmModal from '@/components/common/ConfirmModal';
import { useApi } from '@/hooks/useApi';
import { useSettings } from '@/contexts/SettingsContext';
import { API } from '@/config/routes';

const TABS = [
  { key: 'frontend', label: 'Frontend Settings' },
  { key: 'motivational', label: 'Motivational Speech' },
  { key: 'faqs', label: 'Website FAQS' },
  { key: 'contact', label: 'Contact Information' },
  { key: 'recaptcha', label: 'Recaptcha' },
  { key: 'reviews', label: 'User Reviews' },
  { key: 'logos', label: 'Logo & Images' },
];

export default function WebsiteSettings() {
  const { translate, getImage } = useSettings();
  const { get, post, del } = useApi();

  const [activeTab, setActiveTab] = useState('frontend');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({});
  const [reviews, setReviews] = useState([]);
  const [confirmModal, setConfirmModal] = useState({ open: false });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await get(API.ADMIN_WEBSITE_SETTINGS);
      setData(res.data || {});
      setReviews(res.reviews || []);
    } catch {
      toast.error(translate('Failed to load settings'));
    } finally {
      setLoading(false);
    }
  }, [get, translate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const saveSection = async (type, payload) => {
    try {
      const fd = payload instanceof FormData ? payload : new FormData();
      if (!(payload instanceof FormData)) {
        Object.entries(payload || {}).forEach(([k, v]) => {
          if (v !== undefined && v !== null) fd.append(k, v);
        });
      }
      fd.append('type', type);
      await post(API.ADMIN_WEBSITE_SETTINGS, fd);
      toast.success(translate('Settings saved'));
      fetchData();
    } catch {
      toast.error(translate('Failed to save'));
    }
  };

  const deleteReview = async (id) => {
    try {
      await del(`${API.ADMIN_WEBSITE_SETTINGS}/reviews/${id}`);
      toast.success(translate('Review deleted'));
      fetchData();
    } catch {
      toast.error(translate('Failed to delete'));
    }
    setConfirmModal({ open: false });
  };

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <div className="bg-white border border-gray-100 rounded-lg">
        <div className="px-5 my-3 py-4">
          <h4 className="title text-base">
            <i className="fi-rr-settings-sliders mr-2" />
            {translate('Website Settings')}
          </h4>
        </div>
      </div>

      <div className="flex flex-wrap justify-center">
        <div className="">
          <div className="bg-white border border-gray-100 rounded-lg p-4">
            <div className="">
              <div className="w-full pb-3">
                {/* Tab nav */}
                <ul className="nav flex gap-2 border-b border-gray-200" role="tablist">
                  {TABS.map((tab) => (
                    <li key={tab.key} role="presentation">
                      <button
                        className={`px-3 py-2 text-sm text-gray-600 hover:text-emerald-600 ${activeTab === tab.key ? 'border-b-2 border-emerald-600 text-emerald-700 font-medium -mb-px' : ''}`}
                        type="button"
                        onClick={() => setActiveTab(tab.key)}
                      >
                        {translate(tab.label)}
                      </button>
                    </li>
                  ))}
                </ul>

                <div className="mt-3">
                  {activeTab === 'frontend' && (
                    <FrontendTab data={data} onSave={saveSection} translate={translate} />
                  )}
                  {activeTab === 'motivational' && (
                    <MotivationalTab data={data} onSave={saveSection} translate={translate} />
                  )}
                  {activeTab === 'faqs' && (
                    <FaqsTab data={data} onSave={saveSection} translate={translate} />
                  )}
                  {activeTab === 'contact' && (
                    <ContactTab data={data} onSave={saveSection} translate={translate} />
                  )}
                  {activeTab === 'recaptcha' && (
                    <RecaptchaTab data={data} onSave={saveSection} translate={translate} />
                  )}
                  {activeTab === 'reviews' && (
                    <ReviewsTab
                      reviews={reviews}
                      translate={translate}
                      onDelete={(id) =>
                        setConfirmModal({
                          open: true,
                          onConfirm: () => deleteReview(id),
                        })
                      }
                    />
                  )}
                  {activeTab === 'logos' && (
                    <LogosTab data={data} onSave={saveSection} translate={translate} getImage={getImage} />
                  )}
                </div>
              </div>
            </div>
          </div>
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

/* ─── Tab: Frontend Settings ─────────────────────────────────────────────── */
function FrontendTab({ data, onSave, translate }) {
  const [form, setForm] = useState({
    banner_title: data.banner_title || '',
    banner_sub_title: data.banner_sub_title || '',
    promo_video_provider: data.promo_video_provider || 'youtube',
    promo_video_link: data.promo_video_link || '',
    cookie_status: String(data.cookie_status ?? '0'),
    cookie_note: data.cookie_note || '',
    facebook: data.facebook || '',
    twitter: data.twitter || '',
    linkedin: data.linkedin || '',
    cookie_policy: data.cookie_policy || '',
    about_us: data.about_us || '',
    terms_and_condition: data.terms_and_condition || '',
    privacy_policy: data.privacy_policy || '',
    refund_policy: data.refund_policy || '',
    mobile_app_link: data.mobile_app_link || '',
  });

  const update = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    onSave('frontend_settings', form);
  };

  return (
    <form onSubmit={submit}>
      <h4 className="title mb-3 mt-4">{translate('Frontend website settings')}</h4>

      <div className="fpb-7 mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {translate('Banner title')}<span className="required">*</span>
        </label>
        <input
          className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          type="text"
          value={form.banner_title}
          onChange={(e) => update('banner_title', e.target.value)}
          required
        />
      </div>

      <div className="fpb-7 mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {translate('Banner sub title')}<span className="required">*</span>
        </label>
        <input
          className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          type="text"
          value={form.banner_sub_title}
          onChange={(e) => update('banner_sub_title', e.target.value)}
          required
        />
      </div>

      <div className="fpb-7 mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {translate('Promo Video Provider')}<span className="required">*</span>
        </label>
        <br />
        {['youtube', 'vimeo', 'html5'].map((provider) => (
          <span key={provider} className="mr-3">
            <input
              id={`${provider}_promo_video`}
              className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              type="radio"
              value={provider}
              checked={form.promo_video_provider === provider}
              onChange={(e) => update('promo_video_provider', e.target.value)}
            />
            &nbsp;
            <label htmlFor={`${provider}_promo_video`}>
              {translate(`${provider.charAt(0).toUpperCase() + provider.slice(1)} Video Link`)}
            </label>
          </span>
        ))}
      </div>

      <div className="fpb-7 mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {translate('Promo video link')}<span className="required">*</span>
        </label>
        <input
          className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          type="text"
          value={form.promo_video_link}
          onChange={(e) => update('promo_video_link', e.target.value)}
          required
        />
      </div>

      <div className="fpb-7 mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {translate('Cookie status')}<span className="required">*</span>
        </label>
        <br />
        <input
          className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
          type="radio"
          value="1"
          checked={form.cookie_status === '1'}
          onChange={(e) => update('cookie_status', e.target.value)}
        />
        &nbsp;{translate('Active')}
        &nbsp;&nbsp;
        <input
          className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
          type="radio"
          value="0"
          checked={form.cookie_status === '0'}
          onChange={(e) => update('cookie_status', e.target.value)}
        />
        &nbsp;{translate('Inactive')}
      </div>

      <div className="fpb-7 mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">{translate('Cookie note')}</label>
        <textarea
          className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          rows="5"
          value={form.cookie_note}
          onChange={(e) => update('cookie_note', e.target.value)}
        />
      </div>

      {['facebook', 'twitter', 'linkedin'].map((social) => (
        <div className="fpb-7 mb-3" key={social}>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {translate(social.charAt(0).toUpperCase() + social.slice(1))}
          </label>
          <input
            className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            type="text"
            value={form[social]}
            onChange={(e) => update(social, e.target.value)}
          />
        </div>
      ))}

      {[
        ['cookie_policy', 'Cookie policy'],
        ['about_us', 'About us'],
        ['terms_and_condition', 'Terms and condition'],
        ['privacy_policy', 'Privacy policy'],
        ['refund_policy', 'Refund policy'],
      ].map(([key, label]) => (
        <div className="fpb-7 mb-3" key={key}>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">{translate(label)}</label>
          <textarea
            className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            rows="5"
            value={form[key]}
            onChange={(e) => update(key, e.target.value)}
          />
        </div>
      ))}

      <div className="fpb-7 mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {translate('Mobile App download Link')}<span className="required">*</span>
        </label>
        <input
          className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          type="text"
          value={form.mobile_app_link}
          onChange={(e) => update('mobile_app_link', e.target.value)}
        />
      </div>

      <button className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-emerald-600 text-white hover:bg-emerald-700" type="submit">
        {translate('Update Settings')}
      </button>
    </form>
  );
}

/* ─── Tab: Motivational Speech ───────────────────────────────────────────── */
function MotivationalTab({ data, onSave, translate }) {
  const initial = Array.isArray(data.motivational_speech) && data.motivational_speech.length > 0
    ? data.motivational_speech
    : [{ title: '', designation: '', description: '', image: '' }];

  const [rows, setRows] = useState(initial);

  const update = (idx, key, value) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, [key]: value } : r)));
  };

  const add = () => setRows((prev) => [...prev, { title: '', designation: '', description: '', image: '' }]);
  const remove = (idx) => setRows((prev) => prev.filter((_, i) => i !== idx));

  const submit = (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('type', 'motivational_speech');
    rows.forEach((row, idx) => {
      fd.append('titles[]', row.title || '');
      fd.append('designation[]', row.designation || '');
      fd.append('descriptions[]', row.description || '');
      fd.append('previous_images[]', row.image || '');
      if (row._file) fd.append(`images[${idx}]`, row._file);
    });
    onSave('motivational_speech', fd);
  };

  return (
    <form onSubmit={submit}>
      <h4 className="title mb-3 mt-4">{translate('Motivational Speech')}</h4>
      <div className="flex flex-wrap">
        <div className="w-full md:w-8/12">
          {rows.map((row, idx) => (
            <div className="flex mt-2" key={idx}>
              <div className="flex-grow mb-3 px-2">
                <div className="fpb-7 mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{translate('Title')}</label>
                  <input
                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    type="text"
                    value={row.title}
                    onChange={(e) => update(idx, 'title', e.target.value)}
                  />
                </div>
                <div className="fpb-7 mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{translate('designation')}</label>
                  <input
                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    type="text"
                    value={row.designation}
                    onChange={(e) => update(idx, 'designation', e.target.value)}
                  />
                </div>
                <div className="fpb-7 mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{translate('Description')}</label>
                  <textarea
                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    value={row.description}
                    onChange={(e) => update(idx, 'description', e.target.value)}
                  />
                </div>
                <div className="fpb-7 mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{translate('Image')}</label>
                  <input
                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    type="file"
                    accept="image/*"
                    onChange={(e) => update(idx, '_file', e.target.files?.[0])}
                  />
                </div>
              </div>
              <div className="pt-4">
                {idx === 0 ? (
                  <button
                    className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200 ol-icon-btn mt-2"
                    type="button"
                    onClick={add}
                  >
                    <i className="fi-rr-plus-small" />
                  </button>
                ) : (
                  <button
                    className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200 ol-icon-btn mt-2"
                    type="button"
                    onClick={() => remove(idx)}
                  >
                    <i className="fi-rr-minus-small" />
                  </button>
                )}
              </div>
            </div>
          ))}
          <div className="fpb-7 flex-grow mb-2 px-2">
            <button className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-emerald-600 text-white hover:bg-emerald-700" type="submit">
              {translate('Save changes')}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

/* ─── Tab: FAQs ──────────────────────────────────────────────────────────── */
function FaqsTab({ data, onSave, translate }) {
  const initial = Array.isArray(data.website_faqs) && data.website_faqs.length > 0
    ? data.website_faqs
    : [{ question: '', answer: '' }];

  const [rows, setRows] = useState(initial);

  const update = (idx, key, value) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, [key]: value } : r)));
  };
  const add = () => setRows((prev) => [...prev, { question: '', answer: '' }]);
  const remove = (idx) => setRows((prev) => prev.filter((_, i) => i !== idx));

  const submit = (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('type', 'websitefaqs');
    rows.forEach((row) => {
      fd.append('questions[]', row.question || '');
      fd.append('answers[]', row.answer || '');
    });
    onSave('websitefaqs', fd);
  };

  return (
    <form onSubmit={submit}>
      <h4 className="title mb-3 mt-4">{translate('Website FAQS')}</h4>
      <div className="flex flex-wrap">
        <div className="w-full md:w-8/12">
          {rows.map((row, idx) => (
            <div className="flex mt-2" key={idx}>
              <div className="flex-grow mb-3 px-2">
                <div className="fpb-7 mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{translate('Question')}</label>
                  <input
                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    type="text"
                    value={row.question}
                    onChange={(e) => update(idx, 'question', e.target.value)}
                    placeholder={translate('Write a question')}
                  />
                </div>
                <div className="fpb-7 mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{translate('Answer')}</label>
                  <textarea
                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    value={row.answer}
                    onChange={(e) => update(idx, 'answer', e.target.value)}
                    placeholder={translate('Write a question answer')}
                  />
                </div>
              </div>
              <div className="pt-4">
                {idx === 0 ? (
                  <button
                    className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200 ol-icon-btn mt-2"
                    type="button"
                    onClick={add}
                  >
                    <i className="fi-rr-plus-small" />
                  </button>
                ) : (
                  <button
                    className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200 ol-icon-btn mt-2"
                    type="button"
                    onClick={() => remove(idx)}
                  >
                    <i className="fi-rr-minus-small" />
                  </button>
                )}
              </div>
            </div>
          ))}
          <div className="fpb-7 flex-grow mb-2 px-2">
            <button className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-emerald-600 text-white hover:bg-emerald-700" type="submit">
              {translate('Save changes')}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

/* ─── Tab: Contact Information ───────────────────────────────────────────── */
function ContactTab({ data, onSave, translate }) {
  const info = data.contact_info || {};
  const [form, setForm] = useState({
    email: info.email || '',
    phone: info.phone || '',
    address: info.address || '',
    office_hours: info.office_hours || '',
    location: info.location || '',
  });

  const update = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    onSave('contact_info', form);
  };

  return (
    <form onSubmit={submit}>
      <h4 className="title mb-3 mt-4">{translate('Contact Information')}</h4>
      <div className="flex flex-wrap">
        <div className="w-full md:w-7/12">
          <div className="fpb-7 mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{translate('Contact Email')}</label>
            <textarea
              className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              rows="2"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
            />
          </div>
          <div className="fpb-7 mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{translate('Phone Number')}</label>
            <textarea
              className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              rows="2"
              value={form.phone}
              onChange={(e) => update('phone', e.target.value)}
            />
          </div>
          <div className="fpb-7 mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{translate('Address')}</label>
            <textarea
              className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              rows="2"
              value={form.address}
              onChange={(e) => update('address', e.target.value)}
            />
          </div>
          <div className="fpb-7 mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{translate('Office Hours')}</label>
            <textarea
              className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              rows="2"
              value={form.office_hours}
              onChange={(e) => update('office_hours', e.target.value)}
            />
          </div>
          <div className="fpb-7 mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {translate('Location')}{' '}
              <small className="text-xs text-gray-500">
                ({translate('Latitude')}, {translate('Longitude')})
              </small>
            </label>
            <input
              className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              type="text"
              value={form.location}
              onChange={(e) => update('location', e.target.value)}
              placeholder="40.689880, -74.045203"
            />
          </div>
          <div className="fpb-7 mb-3">
            <button className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-emerald-600 text-white hover:bg-emerald-700" type="submit">
              {translate('Submit')}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

/* ─── Tab: Recaptcha ─────────────────────────────────────────────────────── */
function RecaptchaTab({ data, onSave, translate }) {
  const [form, setForm] = useState({
    recaptcha_status: String(data.recaptcha_status ?? '0'),
    recaptcha_sitekey: data.recaptcha_sitekey || '',
    recaptcha_secretkey: data.recaptcha_secretkey || '',
  });

  const update = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    onSave('recaptcha_settings', form);
  };

  return (
    <form onSubmit={submit}>
      <h4 className="title mb-3 mt-4">{translate('Recaptcha settings')}</h4>
      <div className="fpb-7 mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {translate('Recaptcha status')}<span className="required">*</span>
        </label>
        <br />
        <input
          id="recaptcha_active"
          className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
          type="radio"
          value="1"
          checked={form.recaptcha_status === '1'}
          onChange={(e) => update('recaptcha_status', e.target.value)}
        />{' '}
        <label htmlFor="recaptcha_active">{translate('Active')}</label>
        &nbsp;&nbsp;
        <input
          id="recaptcha_inactive"
          className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
          type="radio"
          value="0"
          checked={form.recaptcha_status === '0'}
          onChange={(e) => update('recaptcha_status', e.target.value)}
        />{' '}
        <label htmlFor="recaptcha_inactive">{translate('Inactive')}</label>
      </div>
      <div className="fpb-7 mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {translate('Recaptcha sitekey')} (v3)<span className="text-red-600 ml-1">*</span>
        </label>
        <input
          className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          type="text"
          value={form.recaptcha_sitekey}
          onChange={(e) => update('recaptcha_sitekey', e.target.value)}
          required
        />
      </div>
      <div className="fpb-7 mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {translate('Recaptcha secretkey')} (v3)<span className="text-red-600 ml-1">*</span>
        </label>
        <input
          className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          type="text"
          value={form.recaptcha_secretkey}
          onChange={(e) => update('recaptcha_secretkey', e.target.value)}
          required
        />
      </div>
      <div className="fpb-7 mb-3">
        <button className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-emerald-600 text-white hover:bg-emerald-700" type="submit">
          {translate('Save changes')}
        </button>
      </div>
    </form>
  );
}

/* ─── Tab: User Reviews List ─────────────────────────────────────────────── */
function ReviewsTab({ reviews, translate, onDelete }) {
  return (
    <div className="flex flex-wrap">
      <div className="w-full">
        <div className="flex justify-end mb-3">
          <button className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors border border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center cg-10px" type="button">
            <span className="fi-rr-plus" />
            <span>{translate('Add new Review')}</span>
          </button>
        </div>
        {reviews.length === 0 ? (
          <NoData message={translate('No reviews found')} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th>#</th>
                  <th>{translate('Name')}</th>
                  <th>{translate('Rating')}</th>
                  <th>{translate('Review')}</th>
                  <th>{translate('Options')}</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((review, idx) => (
                  <tr key={review.id}>
                    <td>{idx + 1}</td>
                    <td>{review.user_name || '-'}</td>
                    <td>{review.rating}</td>
                    <td>{review.review}</td>
                    <td>
                      <div className="relative ol-icon-dropdown ol-icon-dropdown-transparent">
                        <button
                          className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200"
                          type="button"
                          data-bs-toggle="dropdown"
                        >
                          <span className="fi-rr-menu-dots-vertical" />
                        </button>
                        <ul className="absolute mt-2 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-30">
                          <li>
                            <button className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" type="button">
                              {translate('Edit')}
                            </button>
                          </li>
                          <li>
                            <button
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              type="button"
                              onClick={() => onDelete(review.id)}
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
        )}
      </div>
    </div>
  );
}

/* ─── Tab: Logos & Images ────────────────────────────────────────────────── */
function LogosTab({ data, onSave, translate, getImage }) {
  const slots = [
    { type: 'banner_image', field: 'banner_image', label: 'banner image', size: '1000 X 700' },
    { type: 'light_logo', field: 'light_logo', label: 'light logo', size: '330 X 70', dark: true },
    { type: 'dark_logo', field: 'dark_logo', label: 'dark logo', size: '330 X 70' },
    { type: 'favicon', field: 'favicon', label: 'favicon', size: '90 X 90' },
  ];

  const handleUpload = (e, slot) => {
    e.preventDefault();
    const file = e.target.elements[slot.field].files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('type', slot.type);
    fd.append(slot.field, file);
    onSave(slot.type, fd);
  };

  return (
    <div className="flex flex-wrap">
      {slots.map((slot) => (
        <div className="w-full xl:w-1/3 w-full lg:w-1/2" key={slot.type}>
          <div className="bg-white border border-gray-100 rounded-lg p-4">
            <div className="">
              <div className="flex flex-wrap justify-center">
                <form className="text-center" onSubmit={(e) => handleUpload(e, slot)}>
                  <div className="mb-4 mb-2">
                    <div className="wrapper-image-preview flex justify-center">
                      <div className="box">
                        <div className="upload-options">
                          {data[slot.field] && (
                            <img
                              className={slot.dark ? 'bg-dark radious-15px px-2 py-2' : ''}
                              src={getImage(data[slot.field])}
                              alt=""
                              width={slot.type === 'favicon' ? '100' : undefined}
                            />
                          )}
                          <label className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-white border border-gray-100 rounded-lg p-4-text" htmlFor={slot.field}>
                            <small>
                              {translate(`Click here to choose a ${slot.label}`)}
                            </small>
                            <small className="block">({slot.size})</small>
                          </label>
                          <input
                            id={slot.field}
                            className="image-upload hidden"
                            type="file"
                            name={slot.field}
                            accept="image/*"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <button className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-emerald-600 text-white hover:bg-emerald-700 w-full" type="submit">
                    {translate('Save changes')}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
