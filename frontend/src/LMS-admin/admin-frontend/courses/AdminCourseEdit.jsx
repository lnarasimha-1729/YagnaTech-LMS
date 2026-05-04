/**
 * AdminCourseEdit - Edit an existing course with a tabbed interface.
 *
 * ============================================================================
 * ORIGINAL BLADE: resources/views/admin/course/edit.blade.php
 *   Tabs via @includeWhen:
 *     - curriculum  → admin.course.curriculum
 *     - basic       → admin.course.edit_basic
 *     - live-class  → admin.course.live_class
 *     - pricing     → admin.course.edit_pricing
 *     - info        → admin.course.edit_info
 *     - media       → admin.course.edit_media
 *     - seo         → admin.course.edit_seo
 *     - drip-content→ admin.course.edit_drip_settings
 * ============================================================================
 *
 * The original used full-page reloads (tab=xxx query param) to switch tabs.
 * React port keeps tab state in a URL search param (?tab=basic) so deep
 * linking still works but switches are instant (no reload).
 *
 * Each tab's content is rendered inline within this component as a sub-section.
 * The Curriculum tab is special — it has its own CRUD for sections/lessons
 * and doesn't participate in the main form save.
 */

import { useCallback, useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ConfirmModal from '@/components/common/ConfirmModal';
import Modal from '@/components/common/Modal';
import LessonModal from '@/components/course/LessonModal';
import QuizModal from '@/components/course/QuizModal';
import QuestionBuilder from '@/components/course/QuestionBuilder';
import { useApi } from '@/hooks/useApi';
import { useSettings } from '@/contexts/SettingsContext';
import { API, ROUTES, buildRoute } from '@/config/routes';

const TABS = [
  { key: 'curriculum', label: 'Curriculum', icon: 'fi-rr-edit' },
  { key: 'basic', label: 'Basic', icon: 'fi-rr-duplicate' },
  { key: 'live-class', label: 'Live Class', icon: 'fi-rr-file-video' },
  { key: 'pricing', label: 'Pricing', icon: 'fi-rr-comment-dollar' },
  { key: 'info', label: 'Info', icon: 'fi-rr-tags' },
  { key: 'media', label: 'Media', icon: 'fi fi-rr-gallery' },
  { key: 'seo', label: 'SEO', icon: 'fi-rr-note-medical' },
  { key: 'drip-content', label: 'Drip Content', icon: 'fi-rr-settings-sliders' },
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'private', label: 'Private' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'pending', label: 'Pending' },
  { value: 'draft', label: 'Draft' },
  { value: 'inactive', label: 'Inactive' },
];

export default function AdminCourseEdit() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { translate, getImage } = useSettings();
  const { get, post, put, del } = useApi();

  const activeTab = searchParams.get('tab') || 'curriculum';

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Options for dropdowns
  const [categories, setCategories] = useState([]);
  const [languages, setLanguages] = useState([]);

  // Curriculum state
  const [sections, setSections] = useState([]);
  const [expandedSections, setExpandedSections] = useState({});

  // Live class state
  const [liveClasses, setLiveClasses] = useState([]);

  // Modals
  const [confirmModal, setConfirmModal] = useState({ open: false });
  const [sectionModal, setSectionModal] = useState({ open: false, title: '' });
  const [lessonModal, setLessonModal] = useState({ open: false });
  const [quizModal, setQuizModal] = useState({ open: false });
  const [questionBuilder, setQuestionBuilder] = useState({ open: false });

  // Info tab dynamic lists
  const [faqs, setFaqs] = useState([{ title: '', description: '' }]);
  const [requirements, setRequirements] = useState(['']);
  const [outcomes, setOutcomes] = useState(['']);

  // SEO state
  const [seo, setSeo] = useState({});

  // Form for basic/pricing/media/seo/drip tabs
  const { register, handleSubmit, reset, watch, setValue } = useForm();

  const isPaid = watch('is_paid');
  const expiryPeriod = watch('expiry_period');
  const previewProvider = watch('preview_video_provider');
  const dripEnabled = watch('enable_drip_content');
  const completionRole = watch('lesson_completion_role');

  const fetchCourse = useCallback(async () => {
    setLoading(true);
    try {
      const [courseRes, catRes, langRes] = await Promise.all([
        get(API.ADMIN_COURSE(id)),
        get(API.ADMIN_COURSE_CATEGORIES),
        get(API.ADMIN_LANGUAGES),
      ]);

      const data = courseRes.data || courseRes;
      setCourse(data);
      setCategories(catRes.data || catRes || []);
      setLanguages(langRes.data || langRes || []);
      setSections(data.sections || []);
      setLiveClasses(data.live_classes || []);

      // Parse info arrays
      const parsedFaqs = data.faqs || [{ title: '', description: '' }];
      setFaqs(Array.isArray(parsedFaqs) && parsedFaqs.length > 0 ? parsedFaqs : [{ title: '', description: '' }]);

      const parsedReqs = data.requirements || [''];
      setRequirements(Array.isArray(parsedReqs) && parsedReqs.length > 0 ? parsedReqs : ['']);

      const parsedOutcomes = data.outcomes || [''];
      setOutcomes(Array.isArray(parsedOutcomes) && parsedOutcomes.length > 0 ? parsedOutcomes : ['']);

      // SEO data
      setSeo(data.seo || {});

      // Determine preview video provider
      let pvProvider = 'file';
      if (data.preview) {
        if (data.preview.includes('youtu') || data.preview.includes('vimeo') || data.preview.includes('http')) {
          pvProvider = 'link';
        }
      }

      // Drip content settings
      const dripSettings = data.drip_content_settings || {};

      // Reset form with course data
      reset({
        // Basic
        title: data.title || '',
        short_description: data.short_description || '',
        description: data.description || '',
        category_id: data.category_id || '',
        level: data.level || '',
        language: data.language || '',
        status: data.status || 'active',
        // Pricing
        is_paid: String(data.is_paid ?? '1'),
        price: data.price || '',
        discount_flag: data.discount_flag == 1,
        discounted_price: data.discounted_price || '',
        expiry_period: data.expiry_period ? 'limited_time' : 'lifetime',
        number_of_month: data.expiry_period || '',
        // Media
        preview_video_provider: pvProvider,
        preview_link: pvProvider === 'link' ? data.preview : '',
        // SEO
        meta_title: data.seo?.meta_title || '',
        meta_keywords: data.seo?.meta_keywords || '',
        meta_description: data.seo?.meta_description || '',
        meta_robot: data.seo?.meta_robot || '',
        canonical_url: data.seo?.canonical_url || '',
        custom_url: data.seo?.custom_url || '',
        og_title: data.seo?.og_title || '',
        og_description: data.seo?.og_description || '',
        json_ld: data.seo?.json_ld || '',
        // Drip
        enable_drip_content: String(data.enable_drip_content ?? '0'),
        lesson_completion_role: dripSettings.lesson_completion_role || 'percentage',
        minimum_percentage: dripSettings.minimum_percentage || '',
        minimum_duration: dripSettings.minimum_duration || '',
        locked_lesson_message: dripSettings.locked_lesson_message || '',
      });
    } catch (err) {
      toast.error(translate('Failed to load course'));
    } finally {
      setLoading(false);
    }
  }, [get, id, reset, translate]);

  useEffect(() => {
    fetchCourse();
  }, [fetchCourse]);

  const switchTab = (tab) => {
    setSearchParams({ tab });
  };

  const onSave = async (data) => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('tab', activeTab);
      formData.append('course_type', 'general');

      if (activeTab === 'basic') {
        formData.append('title', data.title);
        formData.append('short_description', data.short_description || '');
        formData.append('description', data.description || '');
        formData.append('category_id', data.category_id);
        formData.append('level', data.level);
        formData.append('language', data.language);
        formData.append('status', data.status);
      } else if (activeTab === 'pricing') {
        formData.append('is_paid', data.is_paid);
        if (data.is_paid === '1') {
          formData.append('price', data.price || '');
          formData.append('discount_flag', data.discount_flag ? '1' : '0');
          formData.append('discounted_price', data.discounted_price || '');
        }
        formData.append('expiry_period', data.expiry_period);
        if (data.expiry_period === 'limited_time') {
          formData.append('number_of_month', data.number_of_month || '');
        }
      } else if (activeTab === 'info') {
        faqs.forEach((faq, i) => {
          formData.append(`faq_title[${i}]`, faq.title || '');
          formData.append(`faq_description[${i}]`, faq.description || '');
        });
        requirements.forEach((req, i) => {
          formData.append(`requirements[${i}]`, req || '');
        });
        outcomes.forEach((out, i) => {
          formData.append(`outcomes[${i}]`, out || '');
        });
      } else if (activeTab === 'media') {
        formData.append('preview_video_provider', data.preview_video_provider);
        if (data.preview_video_provider === 'link') {
          formData.append('preview_link', data.preview_link || '');
        }
        if (data.thumbnail?.[0]) formData.append('thumbnail', data.thumbnail[0]);
        if (data.banner?.[0]) formData.append('banner', data.banner[0]);
        if (data.preview_file?.[0]) formData.append('preview', data.preview_file[0]);
      } else if (activeTab === 'seo') {
        ['meta_title', 'meta_keywords', 'meta_description', 'meta_robot', 'canonical_url', 'custom_url', 'og_title', 'og_description', 'json_ld'].forEach((key) => {
          formData.append(key, data[key] || '');
        });
        if (data.og_image?.[0]) formData.append('og_image', data.og_image[0]);
      } else if (activeTab === 'drip-content') {
        formData.append('enable_drip_content', data.enable_drip_content);
        formData.append('lesson_completion_role', data.lesson_completion_role || 'percentage');
        formData.append('minimum_percentage', data.minimum_percentage || '');
        formData.append('minimum_duration', data.minimum_duration || '');
        formData.append('locked_lesson_message', data.locked_lesson_message || '');
      }

      await post(API.ADMIN_COURSE_UPDATE(id), formData);
      toast.success(translate('Changes saved'));
    } catch (err) {
      toast.error(err.response?.data?.message || translate('Failed to save'));
    } finally {
      setSaving(false);
    }
  };

  // ─── Curriculum helpers ──────────────────────────────────────
  const fetchSections = useCallback(async () => {
    try {
      const res = await get(API.ADMIN_COURSE_SECTIONS(id));
      setSections(res.data || res || []);
    } catch { /* silent — sections stay as-is */ }
  }, [get, id]);

  const toggleSection = (sectionId) => {
    setExpandedSections((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  const addSection = async () => {
    const title = sectionModal.title.trim();
    if (!title) return;
    try {
      const res = await post(API.ADMIN_COURSE_SECTIONS(id), { title });
      setSections((prev) => [...prev, res.data || res]);
      setSectionModal({ open: false, title: '' });
      toast.success(translate('Section added'));
    } catch (err) {
      toast.error(translate('Failed to add section'));
    }
  };

  const deleteSection = async (sectionId) => {
    try {
      await del(API.ADMIN_COURSE_SECTION(sectionId));
      setSections((prev) => prev.filter((s) => s.id !== sectionId));
      toast.success(translate('Section deleted'));
    } catch {
      toast.error(translate('Failed to delete section'));
    }
    setConfirmModal({ open: false });
  };

  const deleteLesson = async (lessonId, sectionId) => {
    try {
      await del(API.ADMIN_COURSE_LESSON(lessonId));
      setSections((prev) =>
        prev.map((s) =>
          s.id === sectionId
            ? { ...s, lessons: (s.lessons || []).filter((l) => l.id !== lessonId) }
            : s,
        ),
      );
      toast.success(translate('Lesson deleted'));
    } catch {
      toast.error(translate('Failed to delete lesson'));
    }
    setConfirmModal({ open: false });
  };

  const addLesson = async (sectionId, lessonData) => {
    try {
      const formData = new FormData();
      Object.entries(lessonData).forEach(([k, v]) => {
        if (v instanceof FileList && v[0]) formData.append(k, v[0]);
        else formData.append(k, v || '');
      });
      const res = await post(API.ADMIN_COURSE_LESSONS(sectionId), formData);
      const newLesson = res.data || res;
      setSections((prev) =>
        prev.map((s) =>
          s.id === sectionId
            ? { ...s, lessons: [...(s.lessons || []), newLesson] }
            : s,
        ),
      );
      setLessonModal({ open: false });
      toast.success(translate('Lesson added'));
    } catch (err) {
      toast.error(translate('Failed to add lesson'));
    }
  };

  const onQuizSaved = () => {
    setQuizModal({ open: false });
    fetchSections();
  };

  // ─── Live class helpers ──────────────────────────────────────
  const deleteLiveClass = async (classId) => {
    try {
      await del(API.ADMIN_COURSE_LIVE_CLASS(classId));
      setLiveClasses((prev) => prev.filter((c) => c.id !== classId));
      toast.success(translate('Live class deleted'));
    } catch {
      toast.error(translate('Failed to delete live class'));
    }
    setConfirmModal({ open: false });
  };

  // ─── Info tab helpers ────────────────────────────────────────
  const addFaq = () => setFaqs((prev) => [...prev, { title: '', description: '' }]);
  const removeFaq = (idx) => setFaqs((prev) => prev.filter((_, i) => i !== idx));
  const updateFaq = (idx, field, value) =>
    setFaqs((prev) => prev.map((f, i) => (i === idx ? { ...f, [field]: value } : f)));

  const addRequirement = () => setRequirements((prev) => [...prev, '']);
  const removeRequirement = (idx) => setRequirements((prev) => prev.filter((_, i) => i !== idx));
  const updateRequirement = (idx, value) =>
    setRequirements((prev) => prev.map((r, i) => (i === idx ? value : r)));

  const addOutcome = () => setOutcomes((prev) => [...prev, '']);
  const removeOutcome = (idx) => setOutcomes((prev) => prev.filter((_, i) => i !== idx));
  const updateOutcome = (idx, value) =>
    setOutcomes((prev) => prev.map((o, i) => (i === idx ? value : o)));

  if (loading) return <LoadingSpinner />;
  if (!course) return null;

  const showSaveBtn = activeTab !== 'curriculum' && activeTab !== 'live-class';

  return (
    <>
      {/* Header */}
      <div className="bg-white border border-gray-100 rounded-lg mb-4">
        <div className="flex items-center justify-between flex-wrap gap-3 px-5 py-3">
          <h4 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              {translate('Editing')}
            </span>
            <span className="text-gray-900">{course.title}</span>
          </h4>
          <Link
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
            to={ROUTES.ADMIN_COURSES}
          >
            <span className="fi-rr-arrow-left" />
            <span>{translate('Back')}</span>
          </Link>
        </div>
      </div>

      <div className="w-full">
        <form onSubmit={handleSubmit(onSave)}>
          <div className="bg-white border border-gray-100 rounded-lg p-4">
              {/* Save button row */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <Link
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
                  to={buildRoute(ROUTES.COURSE_DETAIL, { slug: course.slug })}
                  target="_blank"
                >
                  {translate('Frontend View')}
                  <i className="fi-rr-arrow-up-right-from-square" />
                </Link>
                {showSaveBtn && (
                  <button
                    className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                    type="submit"
                    disabled={saving}
                  >
                    {saving ? translate('Saving...') : translate('Save Changes')}
                  </button>
                )}
              </div>

              {/* Tab layout */}
              <div className="flex flex-col md:flex-row gap-4">
                {/* Sidebar tabs */}
                <div className="w-full md:w-56 shrink-0">
                  <div className="flex flex-col">
                    {TABS.map((tab) => (
                      <button
                        key={tab.key}
                        type="button"
                        className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${activeTab === tab.key ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'text-gray-600 hover:text-emerald-600 hover:bg-gray-50'}`}
                        onClick={() => switchTab(tab.key)}
                      >
                        <span className={tab.icon} />
                        <span>{translate(tab.label)}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tab content */}
                <div className="tab-content w-full">
                  {activeTab === 'curriculum' && (
                    <CurriculumTab
                      sections={sections}
                      expandedSections={expandedSections}
                      toggleSection={toggleSection}
                      onAddSection={() => setSectionModal({ open: true, title: '' })}
                      onAddLesson={(sId) => setLessonModal({ open: true, sectionId: sId })}
                      onAddQuiz={(sId) => setQuizModal({ open: true, sectionId: sId })}
                      onEditQuiz={(lesson) => setQuizModal({ open: true, initial: lesson })}
                      onManageQuestions={(quizId) => setQuestionBuilder({ open: true, quizId })}
                      onDeleteSection={(sId) =>
                        setConfirmModal({
                          open: true,
                          onConfirm: () => deleteSection(sId),
                        })
                      }
                      onDeleteLesson={(lId, sId) =>
                        setConfirmModal({
                          open: true,
                          onConfirm: () => deleteLesson(lId, sId),
                        })
                      }
                      translate={translate}
                    />
                  )}

                  {activeTab === 'basic' && (
                    <BasicTab
                      register={register}
                      categories={categories}
                      languages={languages}
                      course={course}
                      translate={translate}
                    />
                  )}

                  {activeTab === 'live-class' && (
                    <LiveClassTab
                      liveClasses={liveClasses}
                      onDelete={(classId) =>
                        setConfirmModal({
                          open: true,
                          onConfirm: () => deleteLiveClass(classId),
                        })
                      }
                      translate={translate}
                      getImage={getImage}
                    />
                  )}

                  {activeTab === 'pricing' && (
                    <PricingTab
                      register={register}
                      isPaid={isPaid}
                      expiryPeriod={expiryPeriod}
                      translate={translate}
                    />
                  )}

                  {activeTab === 'info' && (
                    <InfoTab
                      faqs={faqs}
                      requirements={requirements}
                      outcomes={outcomes}
                      addFaq={addFaq}
                      removeFaq={removeFaq}
                      updateFaq={updateFaq}
                      addRequirement={addRequirement}
                      removeRequirement={removeRequirement}
                      updateRequirement={updateRequirement}
                      addOutcome={addOutcome}
                      removeOutcome={removeOutcome}
                      updateOutcome={updateOutcome}
                      translate={translate}
                    />
                  )}

                  {activeTab === 'media' && (
                    <MediaTab
                      register={register}
                      previewProvider={previewProvider}
                      course={course}
                      translate={translate}
                      getImage={getImage}
                    />
                  )}

                  {activeTab === 'seo' && (
                    <SeoTab
                      register={register}
                      seo={seo}
                      translate={translate}
                      getImage={getImage}
                    />
                  )}

                  {activeTab === 'drip-content' && (
                    <DripTab
                      register={register}
                      dripEnabled={dripEnabled}
                      completionRole={completionRole}
                      translate={translate}
                    />
                  )}
                </div>
              </div>
          </div>
        </form>
      </div>

      <Modal
        isOpen={sectionModal.open}
        onClose={() => setSectionModal({ open: false, title: '' })}
        title={translate('Add new section')}
        size="md"
        footer={(
          <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setSectionModal({ open: false, title: '' })}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              {translate('Cancel')}
            </button>
            <button
              type="button"
              onClick={addSection}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {translate('Add')}
            </button>
          </div>
        )}
      >
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {translate('Section title')}
        </label>
        <input
          type="text"
          value={sectionModal.title}
          onChange={(e) => setSectionModal((prev) => ({ ...prev, title: e.target.value }))}
          autoFocus
          className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </Modal>

      {/* Lesson modal */}
      <LessonModal
        open={lessonModal.open}
        sections={sections}
        initialSectionId={lessonModal.sectionId}
        onClose={() => setLessonModal({ open: false })}
        onSubmit={(payload) => addLesson(payload.section_id, payload)}
        translate={translate}
      />

      {/* Quiz modal (create/edit quiz metadata) */}
      <QuizModal
        open={quizModal.open}
        sections={sections}
        defaultSectionId={quizModal.sectionId}
        initial={quizModal.initial || null}
        storeEndpoint={API.ADMIN_QUIZZES}
        updateEndpoint={API.ADMIN_QUIZ}
        onClose={() => setQuizModal({ open: false })}
        onSaved={onQuizSaved}
      />

      {/* Question builder (manage questions for a quiz) */}
      <QuestionBuilder
        open={questionBuilder.open}
        quizId={questionBuilder.quizId}
        listEndpoint={API.ADMIN_QUIZ_QUESTIONS(questionBuilder.quizId)}
        storeEndpoint={API.ADMIN_QUIZ_QUESTIONS(questionBuilder.quizId)}
        updateEndpoint={API.ADMIN_QUESTION}
        deleteEndpoint={API.ADMIN_QUESTION}
        onClose={() => setQuestionBuilder({ open: false })}
      />

      {/* Confirm modal */}
      <ConfirmModal
        isOpen={confirmModal.open}
        onClose={() => setConfirmModal({ open: false })}
        onConfirm={confirmModal.onConfirm}
      />
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Tab Sub-components
// ═══════════════════════════════════════════════════════════════════════════════

function CurriculumTab({
  sections,
  expandedSections,
  toggleSection,
  onAddSection,
  onAddLesson,
  onAddQuiz,
  onEditQuiz,
  onManageQuestions,
  onDeleteSection,
  onDeleteLesson,
  translate,
}) {
  return (
    <div className="w-full">
      <div className="flex items-center mb-3 flex-wrap gap-2">
        <button type="button" className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200 text-xs" onClick={onAddSection}>
          {translate('Add section')}
        </button>
      </div>

      <ul className="ol-my-accordion">
        {sections.length === 0 ? (
          <li>
            <div className="flex flex-wrap -mx-3">
              <div className="w-full md:w-8/12">
                <button
                  type="button"
                  className="add-section-block mt-4 text-center w-full border-0 bg-transparent"
                  onClick={onAddSection}
                >
                  <p className="sub-title">
                    <i className="fi-rr-add" />
                  </p>
                  <h3 className="title text-15px font-medium mt-2">
                    {translate('Add a new Section')}
                  </h3>
                </button>
              </div>
            </div>
          </li>
        ) : (
          sections.map((section, idx) => (
            <li key={section.id} className="single-accor-item">
              <div
                className="accordion-btn-wrap"
                onClick={() => toggleSection(section.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && toggleSection(section.id)}
              >
                <div className="accordion-btn-title flex items-center">
                  <h4 className="title">
                    {idx + 1}. {section.title}
                  </h4>
                </div>
                <div className="accordion-button-buttons">
                  <button
                    type="button"
                    className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors text-sm text-red-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSection(section.id);
                    }}
                    title={translate('Delete section')}
                  >
                    <span className="fi-rr-trash" />
                  </button>
                </div>
              </div>
              {expandedSections[section.id] && (
                <div className="accoritem-body">
                  <ul className="list-group-3">
                    {(section.lessons || []).length === 0 ? (
                      <li>
                        <h4 className="title">{translate('No lessons are available.')}</h4>
                      </li>
                    ) : (
                      section.lessons.map((lesson) => (
                        <li key={lesson.id}>
                          <h4 className="title">
                            {lesson.lesson_type === 'quiz' && (
                              <span className="inline-block text-xs font-medium px-2 py-0.5 rounded bg-sky-500 mr-1">{translate('Quiz')}</span>
                            )}
                            {lesson.title}
                          </h4>
                          <div className="buttons flex gap-1">
                            {lesson.lesson_type === 'quiz' && (
                              <>
                                <button
                                  type="button"
                                  className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors text-sm bg-gray-100 text-gray-700 hover:bg-gray-200"
                                  onClick={() => onEditQuiz(lesson)}
                                  title={translate('Edit quiz')}
                                >
                                  <span className="fi-rr-edit" />
                                </button>
                                <button
                                  type="button"
                                  className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors text-sm bg-emerald-600 text-white hover:bg-emerald-700"
                                  onClick={() => onManageQuestions(lesson.id)}
                                  title={translate('Manage questions')}
                                >
                                  <span className="fi-rr-list" />
                                </button>
                              </>
                            )}
                            <button
                              type="button"
                              className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors text-sm text-red-600 edit-delete"
                              onClick={() => onDeleteLesson(lesson.id, section.id)}
                              title={translate('Delete lesson')}
                            >
                              <span className="fi-rr-trash" />
                            </button>
                          </div>
                        </li>
                      ))
                    )}
                  </ul>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200 text-xs"
                      onClick={() => onAddLesson?.(section.id)}
                    >
                      <i className="fi-rr-plus mr-1" />
                      {translate('Add lesson')}
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200 text-xs"
                      onClick={() => onAddQuiz?.(section.id)}
                    >
                      <i className="fi-rr-plus mr-1" />
                      {translate('Add quiz')}
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

function BasicTab({ register, categories, languages, course, translate }) {
  return (
    <>
      <input type="hidden" {...register('course_type')} value="general" />

      <div className="flex flex-wrap -mx-3 mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="title">
          {translate('Course title')}
          <span className="text-red-600 ml-1">*</span>
        </label>
        <div>
          <input
            id="title"
            className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            type="text"
            {...register('title', { required: true })}
          />
        </div>
      </div>

      <div className="flex flex-wrap -mx-3 mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {translate('Short description')}
        </label>
        <div>
          <textarea
            className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            rows="3"
            {...register('short_description')}
          />
        </div>
      </div>

      <div className="flex flex-wrap -mx-3 mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {translate('Description')}
        </label>
        <div>
          <textarea
            className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            rows="5"
            {...register('description')}
          />
        </div>
      </div>

      <div className="flex flex-wrap -mx-3 mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {translate('Category')}
          <span className="text-red-600 ml-1">*</span>
        </label>
        <div>
          <select className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" {...register('category_id', { required: true })}>
            <option value="">{translate('Select a category')}</option>
            {categories.map((cat) => (
              <optgroup key={cat.id} label={cat.title}>
                <option value={cat.id}>{cat.title}</option>
                {cat.children?.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    -- {sub.title}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap -mx-3 mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {translate('Course level')}
          <span className="text-red-600 ml-1">*</span>
        </label>
        <div>
          <select className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" {...register('level', { required: true })}>
            <option value="">{translate('Select your course level')}</option>
            <option value="beginner">{translate('Beginner')}</option>
            <option value="intermediate">{translate('Intermediate')}</option>
            <option value="advanced">{translate('Advanced')}</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap -mx-3 mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {translate('Made in')}
          <span className="text-red-600 ml-1">*</span>
        </label>
        <div>
          <select className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" {...register('language', { required: true })}>
            <option value="">{translate('Select your course language')}</option>
            {languages.map((lang) => (
              <option key={lang.id || lang.name} value={lang.name?.toLowerCase()}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap -mx-3 mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {translate('Create as')}
          <span className="text-red-600 ml-1">*</span>
        </label>
        <div>
          <div className="flex flex-wrap gap-4">
            {STATUS_OPTIONS.map((opt) => (
              <div className="flex items-center" key={opt.value}>
                <input
                  id={`status_${opt.value}`}
                  className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  type="radio"
                  value={opt.value}
                  {...register('status', { required: true })}
                />
                <label className="text-sm text-gray-700 ml-2" htmlFor={`status_${opt.value}`}>
                  {translate(opt.label)}
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function PricingTab({ register, isPaid, expiryPeriod, translate }) {
  return (
    <>
      <div className="flex flex-wrap -mx-3 mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {translate('Pricing type')}
          <span className="text-red-600 ml-1">*</span>
        </label>
        <div>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center">
              <input
                id="paid"
                className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                type="radio"
                value="1"
                {...register('is_paid')}
              />
              <label className="text-sm text-gray-700 ml-2" htmlFor="paid">
                {translate('Paid')}
              </label>
            </div>
            <div className="flex items-center">
              <input
                id="free"
                className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                type="radio"
                value="0"
                {...register('is_paid')}
              />
              <label className="text-sm text-gray-700 ml-2" htmlFor="free">
                {translate('Free')}
              </label>
            </div>
          </div>
        </div>
      </div>

      {isPaid === '1' && (
        <div className="paid-section">
          <div className="flex flex-wrap -mx-3 mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {translate('Price')}
              <span className="text-red-600 ml-1">*</span>
            </label>
            <div>
              <input
                className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                type="number"
                placeholder={translate('Enter your course price')}
                min="1"
                step=".01"
                {...register('price')}
              />
            </div>
          </div>

          <div className="flex flex-wrap -mx-3 mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {translate('Discount type')}
            </label>
            <div>
              <div className="flex items-center">
                <input
                  id="discount_flag"
                  className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  type="checkbox"
                  {...register('discount_flag')}
                />
                <label className="text-sm text-gray-700 ml-2" htmlFor="discount_flag">
                  {translate('Check if this course has discount')}
                </label>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap -mx-3 mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {translate('Discounted price')}
            </label>
            <div>
              <input
                className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                type="number"
                placeholder={translate('Enter your discount price')}
                min="1"
                step=".01"
                {...register('discounted_price')}
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap -mx-3 mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {translate('Expiry period')}
        </label>
        <div>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center">
              <input
                id="lifetime_ep"
                className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                type="radio"
                value="lifetime"
                {...register('expiry_period')}
              />
              <label className="text-sm text-gray-700 ml-2" htmlFor="lifetime_ep">
                {translate('Lifetime')}
              </label>
            </div>
            <div className="flex items-center">
              <input
                id="limited_ep"
                className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                type="radio"
                value="limited_time"
                {...register('expiry_period')}
              />
              <label className="text-sm text-gray-700 ml-2" htmlFor="limited_ep">
                {translate('Limited time')}
              </label>
            </div>
          </div>
        </div>
      </div>

      {expiryPeriod === 'limited_time' && (
        <div className="flex flex-wrap -mx-3 mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {translate('Number of month')}
          </label>
          <div>
            <input
              className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              type="number"
              min="1"
              placeholder={translate('After purchase, students can access the course until your selected month.')}
              {...register('number_of_month')}
            />
          </div>
        </div>
      )}
    </>
  );
}

function InfoTab({
  faqs,
  requirements,
  outcomes,
  addFaq,
  removeFaq,
  updateFaq,
  addRequirement,
  removeRequirement,
  updateRequirement,
  addOutcome,
  removeOutcome,
  updateOutcome,
  translate,
}) {
  return (
    <>
      {/* FAQs */}
      <div className="flex flex-wrap -mx-3 mb-3">
        <label className="w-full md:w-2/12 block text-sm font-medium text-gray-700 mb-1.5 block text-sm font-medium text-gray-700 mb-1.5">{translate('Course FAQ')}</label>
        <div className="w-full md:w-10/12">
          {faqs.map((faq, idx) => (
            <div className="flex mt-2" key={idx}>
              <div className="flex-grow px-3">
                <input
                  className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  type="text"
                  value={faq.title}
                  onChange={(e) => updateFaq(idx, 'title', e.target.value)}
                  placeholder={translate('FAQ question')}
                />
                <textarea
                  className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 mt-2"
                  value={faq.description}
                  onChange={(e) => updateFaq(idx, 'description', e.target.value)}
                  placeholder={translate('Answer')}
                  rows="2"
                />
              </div>
              <div>
                {idx === 0 ? (
                  <button
                    type="button"
                    className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200 ol-icon-btn"
                    onClick={addFaq}
                    title={translate('Add new')}
                  >
                    <i className="fi-rr-plus-small" />
                  </button>
                ) : (
                  <button
                    type="button"
                    className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200 ol-icon-btn mt-0"
                    onClick={() => removeFaq(idx)}
                    title={translate('Remove')}
                  >
                    <i className="fi-rr-minus-small" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Requirements */}
      <div className="flex flex-wrap -mx-3 mb-3 pt-2">
        <label className="w-full md:w-2/12 block text-sm font-medium text-gray-700 mb-1.5 block text-sm font-medium text-gray-700 mb-1.5">{translate('Requirements')}</label>
        <div className="w-full md:w-10/12">
          {requirements.map((req, idx) => (
            <div className="flex mt-2" key={idx}>
              <div className="flex-grow px-3">
                <input
                  className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  type="text"
                  value={req}
                  onChange={(e) => updateRequirement(idx, e.target.value)}
                  placeholder={translate('Provide requirements')}
                />
              </div>
              <div>
                {idx === 0 ? (
                  <button
                    type="button"
                    className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200 ol-icon-btn"
                    onClick={addRequirement}
                    title={translate('Add new')}
                  >
                    <i className="fi-rr-plus-small" />
                  </button>
                ) : (
                  <button
                    type="button"
                    className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200 ol-icon-btn mt-0"
                    onClick={() => removeRequirement(idx)}
                    title={translate('Remove')}
                  >
                    <i className="fi-rr-minus-small" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Outcomes */}
      <div className="flex flex-wrap -mx-3 mb-3 pt-2">
        <label className="w-full md:w-2/12 block text-sm font-medium text-gray-700 mb-1.5 block text-sm font-medium text-gray-700 mb-1.5">{translate('Outcomes')}</label>
        <div className="w-full md:w-10/12">
          {outcomes.map((out, idx) => (
            <div className="flex mt-2" key={idx}>
              <div className="flex-grow px-3">
                <input
                  className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  type="text"
                  value={out}
                  onChange={(e) => updateOutcome(idx, e.target.value)}
                  placeholder={translate('Provide outcomes')}
                />
              </div>
              <div>
                {idx === 0 ? (
                  <button
                    type="button"
                    className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200 ol-icon-btn"
                    onClick={addOutcome}
                    title={translate('Add new')}
                  >
                    <i className="fi-rr-plus-small" />
                  </button>
                ) : (
                  <button
                    type="button"
                    className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200 ol-icon-btn mt-0"
                    onClick={() => removeOutcome(idx)}
                    title={translate('Remove')}
                  >
                    <i className="fi-rr-minus-small" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function MediaTab({ register, previewProvider, course, translate, getImage }) {
  return (
    <>
      <div className="flex flex-wrap -mx-3 mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {translate('Thumbnail')}
        </label>
        <div>
          {course.thumbnail && (
            <div className="mb-2">
              <img
                src={getImage(course.thumbnail)}
                alt="thumbnail"
                style={{ maxWidth: '150px', borderRadius: '4px' }}
              />
            </div>
          )}
          <input
            className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            type="file"
            accept="image/*"
            {...register('thumbnail')}
          />
        </div>
      </div>

      <div className="flex flex-wrap -mx-3 mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {translate('Banner')}
        </label>
        <div>
          <input
            className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            type="file"
            accept="image/*"
            {...register('banner')}
          />
        </div>
      </div>

      <hr className="bg-gray-500 my-4" />

      <div className="flex flex-wrap -mx-3 mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {translate('Preview Video')}
        </label>
        <div>
          <div className="flex gap-3 mb-2">
            <label className="flex items-center gap-1">
              <input
                type="radio"
                className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                value="link"
                {...register('preview_video_provider')}
              />
              {translate('Video Link')}
            </label>
            <label className="flex items-center gap-1">
              <input
                type="radio"
                className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                value="file"
                {...register('preview_video_provider')}
              />
              {translate('Video File')}
            </label>
          </div>
        </div>
      </div>

      {previewProvider === 'link' && (
        <div className="flex flex-wrap -mx-3 mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {translate('Video link')}
          </label>
          <div>
            <input
              className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              type="text"
              {...register('preview_link')}
            />
            <small className="text-gray-500">
              {translate('Supported URL')}: <b>Youtube</b> {translate('or')} <b>Vimeo</b>{' '}
              {translate('or')} <b>HTML5</b>
            </small>
          </div>
        </div>
      )}

      {previewProvider === 'file' && (
        <div className="flex flex-wrap -mx-3 mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {translate('Preview Video File')}
          </label>
          <div>
            <input
              className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              type="file"
              accept="video/*"
              {...register('preview_file')}
            />
            <small className="text-gray-500">
              {translate('Supported Video file')}: <b>.mp4</b> {translate('or')} <b>.webm</b>{' '}
              {translate('or')} <b>.ogg</b>
            </small>
          </div>
        </div>
      )}
    </>
  );
}

function SeoTab({ register, seo, translate, getImage }) {
  return (
    <>
      <div className="fpb-7 mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1.5 block text-sm font-medium text-gray-700 mb-1.5">{translate('Meta Title')}</label>
        <input className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" type="text" {...register('meta_title')} />
      </div>

      <div className="fpb-7 mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1.5 block text-sm font-medium text-gray-700 mb-1.5">{translate('Meta Keywords')}</label>
        <input className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" type="text" {...register('meta_keywords')} />
        <small className="text-gray-500">{translate('Writing your keyword and hit the enter')}</small>
      </div>

      <div className="fpb-7 mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1.5 block text-sm font-medium text-gray-700 mb-1.5">{translate('Meta Description')}</label>
        <textarea className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" {...register('meta_description')} />
      </div>

      <div className="fpb-7 mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1.5 block text-sm font-medium text-gray-700 mb-1.5">{translate('Meta Robot')}</label>
        <input className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" type="text" {...register('meta_robot')} />
      </div>

      <div className="fpb-7 mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1.5 block text-sm font-medium text-gray-700 mb-1.5">{translate('Canonical Url')}</label>
        <input className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" type="text" {...register('canonical_url')} />
      </div>

      <div className="fpb-7 mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1.5 block text-sm font-medium text-gray-700 mb-1.5">{translate('Custom Url')}</label>
        <input className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" type="text" {...register('custom_url')} />
      </div>

      <div className="fpb-7 mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1.5 block text-sm font-medium text-gray-700 mb-1.5">{translate('Og Title')}</label>
        <input className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" type="text" {...register('og_title')} />
      </div>

      <div className="fpb-7 mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1.5 block text-sm font-medium text-gray-700 mb-1.5">{translate('Og Description')}</label>
        <textarea className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" {...register('og_description')} />
      </div>

      <div className="fpb-7 mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1.5 block text-sm font-medium text-gray-700 mb-1.5">{translate('Og Image')}</label>
        {seo.og_image && (
          <div className="mb-2">
            <img src={getImage(seo.og_image)} width="150" alt="og" />
          </div>
        )}
        <input className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" type="file" {...register('og_image')} />
      </div>

      <div className="fpb-7 mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1.5 block text-sm font-medium text-gray-700 mb-1.5">{translate('Json Id')}</label>
        <textarea className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" {...register('json_ld')} />
      </div>
    </>
  );
}

function DripTab({ register, dripEnabled, completionRole, translate }) {
  return (
    <>
      <div className="flex flex-wrap -mx-3 mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {translate('Drip content')}
          <span className="text-red-600 ml-1">*</span>
        </label>
        <div>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center">
              <input
                id="drip_off_edit"
                className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                type="radio"
                value="0"
                {...register('enable_drip_content')}
              />
              <label className="text-sm text-gray-700 ml-2" htmlFor="drip_off_edit">
                {translate('Off')}
              </label>
            </div>
            <div className="flex items-center">
              <input
                id="drip_on_edit"
                className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                type="radio"
                value="1"
                {...register('enable_drip_content')}
              />
              <label className="text-sm text-gray-700 ml-2" htmlFor="drip_on_edit">
                {translate('On')}
              </label>
            </div>
          </div>
        </div>
      </div>

      {dripEnabled === '1' && (
        <>
          <div className="flex flex-wrap -mx-3 mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {translate('Lesson completion role')}
              <span className="text-red-600 ml-1">*</span>
            </label>
            <div>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center">
                  <input
                    id="pct_wise"
                    className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    type="radio"
                    value="percentage"
                    {...register('lesson_completion_role')}
                  />
                  <label className="text-sm text-gray-700 ml-2" htmlFor="pct_wise">
                    {translate('Video percentage wise')}
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="dur_wise"
                    className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    type="radio"
                    value="duration"
                    {...register('lesson_completion_role')}
                  />
                  <label className="text-sm text-gray-700 ml-2" htmlFor="dur_wise">
                    {translate('Video duration wise')}
                  </label>
                </div>
              </div>
            </div>
          </div>

          {completionRole === 'percentage' && (
            <div className="flex flex-wrap -mx-3 mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {translate('Minimum percentage to watch')} (%)
                <span className="text-red-600 ml-1">*</span>
              </label>
              <div>
                <input
                  className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  type="text"
                  placeholder="50"
                  {...register('minimum_percentage')}
                />
              </div>
            </div>
          )}

          {completionRole === 'duration' && (
            <div className="flex flex-wrap -mx-3 mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {translate('Minimum duration to watch')}
                <span className="text-red-600 ml-1">*</span>
              </label>
              <div>
                <input
                  className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  type="text"
                  placeholder="00:01:10"
                  {...register('minimum_duration')}
                />
              </div>
            </div>
          )}

          <div className="flex flex-wrap -mx-3 mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {translate('Message for locked lesson')}
            </label>
            <div>
              <textarea
                className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                rows="4"
                {...register('locked_lesson_message')}
              />
            </div>
          </div>
        </>
      )}
    </>
  );
}

function LiveClassTab({ liveClasses, onDelete, translate, getImage }) {
  return (
    <div className="flex flex-wrap -mx-3">
      <div className="w-full">
        <div className="overflow-x-auto overflow-auto">
          <table className="eTable eTable-2 w-full">
            <thead>
              <tr>
                <th>{translate('Instructor')}</th>
                <th>{translate('Class topic')}</th>
                <th>{translate('Class Schedule')}</th>
                <th>{translate('Action')}</th>
              </tr>
            </thead>
            <tbody>
              {liveClasses.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center text-gray-500 py-4">
                    {translate('No live classes scheduled')}
                  </td>
                </tr>
              ) : (
                liveClasses.map((lc) => (
                  <tr key={lc.id}>
                    <td>
                      <div className="dAdmin_profile flex items-center min-w-200px">
                        <div className="dAdmin_profile_img">
                          <img
                            className="img-fluid rounded-full image-45"
                            src={getImage(lc.user?.photo)}
                            width="40"
                            height="40"
                            alt=""
                          />
                        </div>
                        <div className="ml-1">
                          <h4 className="title text-sm">{lc.user?.name}</h4>
                          <p className="sub-title2 text-xs">{lc.user?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <p className="title text-xs">{lc.class_topic}</p>
                    </td>
                    <td>
                      <p className="sub-title text-xs">
                        {lc.class_date_and_time
                          ? new Date(lc.class_date_and_time).toLocaleString()
                          : ''}
                      </p>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors text-red-600 px-1 py-0"
                        onClick={() => onDelete(lc.id)}
                        title={translate('Delete')}
                      >
                        <i className="fi-rr-trash" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
