import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getCourse, updateCourse } from '../../api/course';
import { listCategories } from '../../api/category';
import BasicTab from './tabs/BasicTab';
import PricingTab from './tabs/PricingTab';
import InfoTab from './tabs/InfoTab';
import MediaTab from './tabs/MediaTab';
import SeoTab from './tabs/SeoTab';
import DripTab from './tabs/DripTab';
import CurriculumTab from './tabs/CurriculumTab';
import LiveClassTab from './tabs/LiveClassTab';

const TABS = [
    { key: 'curriculum', label: 'Curriculum', icon: 'fi-rr-menu-burger' },
    { key: 'basic', label: 'Basic', icon: 'fi-rr-duplicate' },
    { key: 'live-class', label: 'Live Class', icon: 'fi-rr-video-camera' },
    { key: 'pricing', label: 'Pricing', icon: 'fi-rr-comment-dollar' },
    { key: 'info', label: 'Info', icon: 'fi-rr-tags' },
    { key: 'media', label: 'Media', icon: 'fi fi-rr-gallery' },
    { key: 'seo', label: 'SEO', icon: 'fi-rr-note-medical' },
    { key: 'drip-content', label: 'Drip Content', icon: 'fi-rr-settings-sliders' },
];

const PLAYER_BASE = '/courses/programs/course-details/play';
const COURSE_DETAILS_BASE = '/courses/programs/course-details';
const COURSE_FORM_ID = 'admin-course-edit-form';

export default function CourseEdit() {
    const { id } = useParams();
    const [course, setCourse] = useState(null);
    const [categories, setCategories] = useState([]);
    const [tab, setTab] = useState('basic');

    const load = async () => {
        const res = await getCourse(id);
        setCourse(res.course_details);
    };

    useEffect(() => { load(); }, [id]);
    useEffect(() => { listCategories().then((r) => setCategories(r.categories)); }, []);

    const onSave = async (fd) => {
        fd.append('tab', tab);
        try {
            await updateCourse(id, fd);
            toast.success('Course updated successfully');
            load();
        } catch (e) { toast.error(e.response?.data?.error || 'Failed'); }
    };

    if (!course) return <div className="p-10 text-center text-gray">Loading...</div>;

    const slug = course.slug;
    const frontendUrl = slug ? `${COURSE_DETAILS_BASE}?slug=${slug}` : COURSE_DETAILS_BASE;
    const playerUrl = slug ? `${PLAYER_BASE}/${slug}` : PLAYER_BASE;
    // Tabs that submit a form get a Save Changes button in the header. The button
    // is wired via the HTML `form` attribute so it submits whichever tab is active.
    const isFormTab = ['basic', 'pricing', 'info', 'media', 'seo', 'drip-content'].includes(tab);

    return (
        <div>
            <div className="ol-card rounded-ol-8 mb-3">
                <div className="ol-card-body py-12px px-20px my-3">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-2">
                            <Link
                                to={frontendUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="ol-btn-outline-secondary flex items-center gap-2"
                            >
                                <span>Frontend View</span>
                                <i className="fi-rr-arrow-up-right" />
                            </Link>
                            <Link
                                to={playerUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="ol-btn-outline-secondary flex items-center gap-2"
                            >
                                <span>Course Player</span>
                                <i className="fi-rr-arrow-up-right" />
                            </Link>
                        </div>
                        <div className="ml-auto flex items-center gap-2">
                            {isFormTab && (
                                <button
                                    type="submit"
                                    form={COURSE_FORM_ID}
                                    className="ol-btn-primary"
                                >
                                    Save Changes
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="ol-card">
                <div className="ol-card-body p-20px">
                    <div className="flex flex-wrap md:flex-nowrap gap-3">
                        {/* Sidebar */}
                        <div className="ol-sidebar-tab w-full md:w-[200px]">
                            <div className="flex flex-col">
                                {TABS.map((t) => (
                                    <button
                                        key={t.key}
                                        type="button"
                                        className={`nav-link ${tab === t.key ? 'active' : ''}`}
                                        onClick={() => setTab(t.key)}
                                    >
                                        <span className={t.icon} />
                                        <span>{t.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="tab-content w-full flex-1">
                            {tab === 'basic' && <BasicTab course={course} categories={categories} onSave={onSave} formId={COURSE_FORM_ID} />}
                            {tab === 'pricing' && <PricingTab course={course} onSave={onSave} formId={COURSE_FORM_ID} />}
                            {tab === 'info' && <InfoTab course={course} onSave={onSave} formId={COURSE_FORM_ID} />}
                            {tab === 'curriculum' && <CurriculumTab course={course} />}
                            {tab === 'live-class' && <LiveClassTab course={course} />}
                            {tab === 'media' && <MediaTab course={course} onSave={onSave} formId={COURSE_FORM_ID} />}
                            {tab === 'seo' && <SeoTab course={course} onSave={onSave} formId={COURSE_FORM_ID} />}
                            {tab === 'drip-content' && <DripTab course={course} onSave={onSave} formId={COURSE_FORM_ID} />}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
