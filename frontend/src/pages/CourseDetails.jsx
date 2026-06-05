import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { getCourseDetails } from '@/api/course/courseApi';
import { enrollCourse } from '@/api/userProgressApi';
import { fmtDuration, safeArr } from '@/components/course/format';
import PreviewModal from '@/components/course/PreviewModal';

// admin-service serves uploaded images (banner/thumbnail) under /uploads. The
// API returns RELATIVE paths (e.g. "uploads/course-thumbnail/x.png"), so they
// must be prefixed with the admin base or the browser resolves them against the
// current page URL and 404s. Mirrors Programspage.tsx's ADMIN_BASE.
const ADMIN_BASE = import.meta.env.VITE_ADMIN_API_URL || 'http://localhost:4000';
const assetUrl = (raw) => {
    if (!raw) return '';
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
    return `${ADMIN_BASE}/${String(raw).replace(/^\/+/, '')}`;
};

const TABS = [
    { key: 'overview', label: 'Overview' },
    { key: 'curriculum', label: 'Curriculum' },
    { key: 'details', label: 'Details' },
    { key: 'instructor', label: 'Instructor' },
    { key: 'reviews', label: 'Reviews' },
];

export default function CourseDetails({ slug: slugProp } = {}) {
    const params = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const slug = slugProp || params.slug || searchParams.get('slug') || 'first';
    const [data, setData] = useState(null);
    const [tab, setTab] = useState('overview');
    const [preview, setPreview] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // Stays true after the user clicks Enroll/Start Learning. Component unmounts
    // when the player route mounts, so we never need to clear it explicitly.
    const [enrolling, setEnrolling] = useState(false);

    const handleEnroll = async (e) => {
        e?.preventDefault?.();
        if (enrolling || !data?.course?.slug) return;
        setEnrolling(true);
        // Persist enrollment so revisits from /programs auto-redirect to the player.
        // program_id is carried in the URL by /programs/select; if absent (user came
        // here some other way), we still navigate so existing flows aren't broken.
        const programId = Number(searchParams.get('program_id'));
        if (programId && data?.course?.id) {
            try {
                const { target } = await enrollCourse(programId, data.course.id);
                if (target?.player_path) {
                    navigate(target.player_path);
                    return;
                }
            } catch {
                /* fall through to plain navigation */
            }
        }
        navigate(`/courses/programs/course-details/play/${data.course.slug}`);
    };

    useEffect(() => {
        let alive = true;
        setLoading(true);
        getCourseDetails(slug)
            .then((res) => { if (alive) setData(res); })
            .catch((err) => { if (alive) setError(err?.response?.data?.error || 'Failed to load course'); })
            .finally(() => { if (alive) setLoading(false); });
        return () => { alive = false; };
    }, [slug]);

    // Skeleton mirroring the real course-details layout (hero on the left,
    // enrolment/price card on the right, tabs + body below). Same animate-pulse
    // approach as CoursePlayer's skeleton so loading feel is consistent across
    // the click → navigate → mount sequence.
    if (loading) return <CourseDetailsSkeleton />;
    if (error) return <div className="max-w-[1280px] mx-auto px-4 py-16 text-center text-danger">{error}</div>;
    if (!data) return null;

    const { course, reviews } = data;
    const stars = Math.round(course.average_rating || 0);
    const requirements = safeArr(course.requirements);
    const outcomes = safeArr(course.outcomes);
    const faqs = safeArr(course.faqs);

    return (
        <>
            {enrolling && (
                <div
                    className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm"
                    role="status"
                    aria-live="polite"
                >
                    <div className="w-12 h-12 border-4 border-[#177385] border-t-transparent rounded-full animate-spin" />
                    <p className="mt-4 text-gray-700 font-medium">Loading your course…</p>
                </div>
            )}

            {/* Breadcrumb + course header */}
            <section className="bg-gradient-to-b from-lightgreen/40 to-white border-b border-border">
                <div className="max-w-[1280px] mx-auto px-4 py-10">
                    <nav className="text-[13px] mb-5 flex items-center gap-2 text-muted">
                        <Link to="/" className="hover:text-skin transition-colors">Home</Link>
                        <i className="fa fa-chevron-right text-[10px]" />
                        <span className="text-dark font-medium truncate max-w-[60vw]">{course.title}</span>
                    </nav>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2">
                            {course.level && (
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-skin bg-lightgreen px-3 py-1.5 rounded-full mb-4">
                                    <i className="fa fa-bolt text-[10px]" />
                                    {course.level}
                                </span>
                            )}
                            <h1 className="text-[28px] sm:text-[36px] lg:text-[40px] font-bold text-dark leading-[1.15] tracking-tight mb-4">
                                {course.title}
                            </h1>
                            <p className="text-[15px] sm:text-[16px] text-muted leading-relaxed mb-6 max-w-2xl">
                                {course.short_description}
                            </p>

                            <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-[13px] text-dark mb-6">
                                <div className="flex items-center gap-1.5">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <i key={i} className={`fa fa-star text-[13px] ${i < stars ? 'text-amber-400' : 'text-border'}`} />
                                    ))}
                                    <span className="ml-1 font-semibold">{(course.average_rating || 0).toFixed(1)}</span>
                                    <span className="text-muted">({course.review_count || 0})</span>
                                </div>
                                <span className="text-border">•</span>
                                <div className="flex items-center gap-1.5 text-muted">
                                    <i className="fa fa-users text-[12px]" />
                                    <span><span className="font-semibold text-dark">{course.enrolled || 0}</span> students</span>
                                </div>
                                <span className="text-border">•</span>
                                <div className="flex items-center gap-1.5 text-muted">
                                    <i className="fa fa-clock text-[12px]" />
                                    <span>{fmtDuration(course.total_duration_secs)}</span>
                                </div>
                                <span className="text-border">•</span>
                                <div className="flex items-center gap-1.5 text-muted">
                                    <i className="fa fa-language text-[12px]" />
                                    <span className="capitalize">{course.language}</span>
                                </div>
                                {course.has_certificate && (
                                    <>
                                        <span className="text-border">•</span>
                                        <div className="flex items-center gap-1.5 text-muted">
                                            <i className="fa fa-graduation-cap text-[12px]" />
                                            <span>Certificate</span>
                                        </div>
                                    </>
                                )}
                            </div>

                            {course.creator && (
                                <div className="flex items-center gap-3 pt-1">
                                    <img
                                        src={assetUrl(course.creator.photo)}
                                        alt=""
                                        className="w-11 h-11 rounded-full object-cover ring-2 ring-white shadow-sm"
                                    />
                                    <div className="leading-tight">
                                        <p className="text-[11px] uppercase tracking-wider text-muted m-0">Created by</p>
                                        <p className="text-[14px] font-semibold text-dark m-0">{course.creator.name}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Pricing card */}
                        <PricingCard
                            course={course}
                            onPreview={() => setPreview(true)}
                            onEnroll={handleEnroll}
                            enrolling={enrolling}
                        />
                    </div>
                </div>
            </section>

            {/* Tabs */}
            <section className="bg-bodybg/40">
                <div className="bg-white border-b border-border">
                    <div className="max-w-[1280px] mx-auto px-4">
                        <div className="flex gap-1 sm:gap-6 overflow-x-auto">
                            {TABS.map((t) => {
                                const active = tab === t.key;
                                return (
                                    <button
                                        key={t.key}
                                        type="button"
                                        onClick={() => setTab(t.key)}
                                        className={`relative whitespace-nowrap px-3 sm:px-1 py-4 text-[14px] font-medium transition-colors ${
                                            active ? 'text-skin' : 'text-muted hover:text-dark'
                                        }`}
                                    >
                                        {t.label}
                                        {active && (
                                            <span className="absolute left-0 right-0 -bottom-px h-[3px] bg-skin rounded-t" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
                <div className="max-w-[1280px] mx-auto px-4 py-10">
                    {tab === 'overview' && <Overview course={course} outcomes={outcomes} faqs={faqs} />}
                    {tab === 'curriculum' && <Curriculum course={course} />}
                    {tab === 'details' && <Details requirements={requirements} outcomes={outcomes} />}
                    {tab === 'instructor' && <Instructor instructor={course.creator} />}
                    {tab === 'reviews' && <Reviews course={course} reviews={reviews} stars={stars} />}
                </div>
            </section>

            {preview && course.preview && (
                <PreviewModal src={assetUrl(course.preview)} onClose={() => setPreview(false)} />
            )}
        </>
    );
}

function PricingCard({ course, onPreview, onEnroll, enrolling }) {
    // is_paid can come back as 0/1 (MySQL) or false/true; treat anything
    // falsy / explicit zero as "Free". Paid courses surface the price block
    // above the CTA; free courses show a "Free enrolment" line instead.
    const isFree = !course.is_paid || Number(course.is_paid) === 0;

    const price = Number(course.price || 0);
    const discounted = Number(course.discounted_price || 0);
    // discount_flag is the admin's "Apply discount" checkbox. Only show the
    // strike-through pricing when the flag is on AND the discounted value is
    // strictly less than the regular price (defensive — admin could leave a
    // stale value behind).
    const hasDiscount = !isFree && !!course.discount_flag && discounted > 0 && discounted < price;
    const effectivePrice = hasDiscount ? discounted : price;
    const formatPrice = (n) => `$${n.toFixed(2)}`;
    const percentOff = hasDiscount && price > 0
        ? Math.round(((price - discounted) / price) * 100)
        : 0;

    // expiry_period stores the number of months access lasts after enrolment.
    // NULL (or missing) means lifetime. Render the real value so the line
    // reflects what the admin set in the Pricing tab.
    const months = Number(course.expiry_period) || 0;
    const expiryLabel = months > 0
        ? `${months} month${months === 1 ? '' : 's'} access`
        : 'Lifetime access';
    const expiryIcon = months > 0 ? 'fa-hourglass-half' : 'fa-infinity';

    const includes = [
        ...(isFree
            ? [{ icon: 'fa-tag', label: 'Free enrolment' }]
            : [{ icon: 'fa-tag', label: `Paid course · ${formatPrice(effectivePrice)}` }]),
        { icon: 'fa-play-circle', label: `${course.lesson_count} on-demand lessons` },
        { icon: 'fa-layer-group', label: `${course.section_count} sections` },
        { icon: 'fa-clock', label: `${fmtDuration(course.total_duration_secs)} total length` },
        { icon: expiryIcon, label: expiryLabel },
        ...(course.has_certificate ? [{ icon: 'fa-certificate', label: 'Certificate of completion' }] : []),
    ];
    return (
        <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden sticky top-[80px]">
                <button
                    type="button"
                    onClick={onPreview}
                    className="block relative w-full aspect-video bg-bodybg group"
                >
                    <img
                        src={assetUrl(course.banner || course.thumbnail)}
                        alt=""
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                    {course.preview ? (
                        <span className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-t from-black/60 via-black/30 to-transparent">
                            <span className="w-16 h-16 rounded-full bg-white text-skin flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                <i className="fa fa-play text-[20px] ml-1" />
                            </span>
                            <span className="mt-3 text-white text-[13px] font-medium tracking-wide">
                                Watch preview
                            </span>
                        </span>
                    ) : (
                        <span className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                    )}
                </button>
                <div className="p-6">
                    {/* Price block — only renders for paid courses. Free
                        courses skip this entirely so the CTA sits at the top
                        of the card (the "Enrol for free" button already
                        communicates the price). */}
                    {!isFree && (
                        <div className="mb-4">
                            <div className="flex items-baseline gap-3 flex-wrap">
                                <span className="text-[28px] font-bold text-dark leading-none">
                                    {formatPrice(effectivePrice)}
                                </span>
                                {hasDiscount && (
                                    <>
                                        <span className="text-[16px] text-muted line-through">
                                            {formatPrice(price)}
                                        </span>
                                        <span className="text-[11px] font-semibold uppercase tracking-wider bg-amber-100 text-amber-700 px-2 py-1 rounded">
                                            {percentOff}% off
                                        </span>
                                    </>
                                )}
                            </div>
                            {hasDiscount && (
                                <p className="text-[12px] text-muted mt-1.5">
                                    You save {formatPrice(price - discounted)}
                                </p>
                            )}
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={onEnroll}
                        disabled={enrolling}
                        className="w-full bg-skin hover:bg-skin/90 text-white font-semibold py-3 rounded-lg shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {enrolling ? (
                            <>
                                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                Loading…
                            </>
                        ) : (
                            <>
                                {isFree ? 'Go to Course' : 'Buy this course'}
                                <i className="fa fa-arrow-right text-[12px]" />
                            </>
                        )}
                    </button>

                    <div className="mt-6 pt-5 border-t border-border">
                        <p className="text-[11px] uppercase tracking-wider text-muted font-semibold mb-3">
                            This course includes
                        </p>
                        <ul className="space-y-2.5 text-[13px] text-dark">
                            {includes.map((item) => (
                                <li key={item.label} className="flex items-center gap-3">
                                    <i className={`fa ${item.icon} text-skin w-4 text-center`} />
                                    <span>{item.label}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Overview({ course, outcomes, faqs }) {
    return (
        <div className="space-y-10 max-w-4xl">
            {outcomes.length > 0 && (
                <div className="bg-white border border-border rounded-2xl p-6 sm:p-8">
                    <SectionHeading icon="fa-bullseye" title="What you'll learn" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 mt-5">
                        {outcomes.map((o, i) => (
                            <div key={i} className="flex items-start gap-3 text-[14px] text-dark leading-relaxed">
                                <i className="fa fa-check text-skin mt-1 flex-shrink-0" />
                                <span>{o}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div>
                <SectionHeading icon="fa-align-left" title="Description" />
                <div
                    className="mt-5 text-[15px] text-dark leading-[1.75] prose-custom"
                    dangerouslySetInnerHTML={{ __html: course.description || '' }}
                />
            </div>

            {faqs.length > 0 && (
                <div>
                    <SectionHeading icon="fa-circle-question" title="FAQ" />
                    <div className="mt-5 border-t border-border">
                        {faqs.map((f, i) => (
                            <details key={i} className="group border-b border-border">
                                <summary className="cursor-pointer list-none flex items-center justify-between gap-4 py-5 px-2 hover:bg-lightgreen/30 transition-colors rounded">
                                    <span className="font-semibold text-dark text-[15px]">{f.title}</span>
                                    <span className="flex-shrink-0 w-7 h-7 flex items-center justify-center text-dark text-[20px] leading-none rounded-full group-open:bg-skin group-open:text-white transition-colors">
                                        <span className="group-open:hidden">+</span>
                                        <span className="hidden group-open:inline">−</span>
                                    </span>
                                </summary>
                                <div className="px-2 pb-5 text-[14px] text-muted leading-relaxed">
                                    {f.description}
                                </div>
                            </details>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function Curriculum({ course }) {
    const totalLessons = course.sections.reduce((sum, s) => sum + s.lessons.length, 0);
    return (
        <div className="max-w-4xl">
            <div className="flex items-center justify-between mb-5">
                <SectionHeading icon="fa-list-check" title="Course curriculum" />
                <p className="text-[13px] text-muted whitespace-nowrap ml-4">
                    <span className="font-semibold text-dark">{course.sections.length}</span> sections ·{' '}
                    <span className="font-semibold text-dark">{totalLessons}</span> lessons
                </p>
            </div>
            <div className="space-y-3">
                {course.sections.map((sec, idx) => (
                    <details
                        key={sec.id}
                        className="group bg-white border border-border rounded-xl overflow-hidden transition-shadow hover:shadow-sm"
                        open={idx === 0}
                    >
                        <summary className="cursor-pointer list-none p-4 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                                <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-lightgreen text-skin text-[13px] font-bold flex items-center justify-center">
                                    {String(idx + 1).padStart(2, '0')}
                                </span>
                                <span className="font-semibold text-dark text-[15px] truncate">{sec.title}</span>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                                <span className="text-[12px] text-muted">{sec.lessons.length} lessons</span>
                                <i className="fa fa-chevron-down text-muted text-[12px] group-open:rotate-180 transition-transform" />
                            </div>
                        </summary>
                        <ul className="border-t border-border divide-y divide-border bg-bodybg/30">
                            {sec.lessons.map((l) => (
                                <li
                                    key={l.id}
                                    className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-lightgreen/20 transition-colors"
                                >
                                    <div className="flex items-center gap-3 text-[14px] min-w-0">
                                        <LessonTypeIcon type={l.lesson_type} />
                                        <span className="text-dark truncate">{l.title}</span>
                                    </div>
                                    {l.duration && l.duration !== '00:00:00' && (
                                        <span className="text-[12px] text-muted whitespace-nowrap">{l.duration}</span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </details>
                ))}
            </div>
        </div>
    );
}

function SectionHeading({ icon, title }) {
    return (
        <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-lg bg-lightgreen text-skin flex items-center justify-center flex-shrink-0">
                <i className={`fa ${icon} text-[14px]`} />
            </span>
            <h3 className="text-[20px] font-bold text-dark m-0 tracking-tight">{title}</h3>
        </div>
    );
}

function LessonTypeIcon({ type }) {
    if (['video-url', 'system-video', 'vimeo-url', 'html5'].includes(type)) return <i className="fa fa-video text-muted" />;
    if (type === 'image') return <i className="fa fa-image text-muted" />;
    if (type === 'google_drive') return <i className="fab fa-google-drive text-muted" />;
    if (type === 'quiz') return <i className="fa fa-question-circle text-muted" />;
    return <i className="fa fa-file text-muted" />;
}

function Details({ requirements, outcomes }) {
    const panel = (icon, title, items, empty, accent) => (
        <div className="bg-white border border-border rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
                <span className={`w-10 h-10 rounded-xl ${accent} flex items-center justify-center`}>
                    <i className={`fa ${icon} text-[16px]`} />
                </span>
                <h3 className="text-[17px] font-semibold text-dark m-0">{title}</h3>
            </div>
            {items.length === 0 ? (
                <p className="text-[14px] text-muted">{empty}</p>
            ) : (
                <ul className="space-y-2.5">
                    {items.map((v, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-[14px] text-dark leading-relaxed">
                            <i className="fa fa-circle text-[6px] text-skin mt-2 flex-shrink-0" />
                            <span>{v}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
            {panel('fa-clipboard-list', 'Requirements', requirements, 'No specific requirements.', 'bg-amber-100 text-amber-600')}
            {panel('fa-trophy', 'Outcomes', outcomes, 'No outcomes listed.', 'bg-lightgreen text-skin')}
        </div>
    );
}

function Instructor({ instructor }) {
    if (!instructor) {
        return (
            <div className="bg-white border border-border rounded-2xl p-10 text-center max-w-4xl">
                <i className="fa fa-user-slash text-muted text-[28px] mb-3" />
                <p className="text-[14px] text-muted">Instructor info not available.</p>
            </div>
        );
    }

    // "Area of Expertise" (the expertise column, exposed as skills/about).
    // Shown only as chips below the bio. Split on commas for multiple values;
    // a single value renders as one chip. Falls back to `skills` for legacy
    // rows.
    const expertiseRaw = (instructor.skills || instructor.about || '').trim();
    const expertiseChips = expertiseRaw
        ? expertiseRaw.split(',').map((s) => s.trim()).filter(Boolean)
        : [];

    const hasBody = instructor.biography || expertiseChips.length > 0;

    return (
        <div className="max-w-4xl">
            <SectionHeading icon="fa-user-tie" title="About the instructor" />
            <div className="mt-5 bg-white border border-border rounded-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-lightgreen/40 to-white p-6 sm:p-8 flex flex-col sm:flex-row gap-6 items-center sm:items-start">
                    <img
                        src={assetUrl(instructor.photo)}
                        alt={instructor.name || ''}
                        className="w-28 h-28 rounded-full object-cover flex-shrink-0 ring-4 ring-white shadow-md"
                    />
                    <div className="text-center sm:text-left flex-1 min-w-0">
                        <h3 className="text-[22px] font-bold text-dark m-0">{instructor.name}</h3>
                        {/* Expertise is shown once, as chips below the bio — not
                            repeated here as a tagline. */}
                        <div className="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1.5 text-[12px] text-muted">
                            {instructor.email && (
                                <a
                                    href={`mailto:${instructor.email}`}
                                    className="inline-flex items-center gap-1.5 hover:text-skin transition-colors"
                                >
                                    <i className="fa fa-envelope" />
                                    {instructor.email}
                                </a>
                            )}
                            {instructor.linkedinUrl && (
                                <a
                                    href={instructor.linkedinUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 hover:text-skin transition-colors"
                                >
                                    <i className="fab fa-linkedin" />
                                    LinkedIn
                                </a>
                            )}
                            {instructor.facebookUrl && (
                                <a
                                    href={instructor.facebookUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 hover:text-skin transition-colors"
                                >
                                    <i className="fab fa-facebook" />
                                    Facebook
                                </a>
                            )}
                            {instructor.twitterUrl && (
                                <a
                                    href={instructor.twitterUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 hover:text-skin transition-colors"
                                >
                                    <i className="fab fa-twitter" />
                                    Twitter
                                </a>
                            )}
                        </div>
                    </div>
                </div>
                {hasBody && (
                    <div className="p-6 sm:p-8 border-t border-border space-y-5">
                        {instructor.biography ? (
                            <div
                                className="text-[14px] text-dark leading-[1.75] prose-custom"
                                dangerouslySetInnerHTML={{ __html: instructor.biography }}
                            />
                        ) : (
                            <p className="text-[14px] text-muted italic m-0">
                                No biography yet.
                            </p>
                        )}
                        {expertiseChips.length > 0 && (
                            <div>
                                <p className="text-[11px] uppercase tracking-wider text-muted font-semibold mb-2">
                                    Areas of expertise
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {expertiseChips.map((s, i) => (
                                        <span
                                            key={i}
                                            className="text-[12px] font-medium bg-lightgreen text-skin px-3 py-1.5 rounded-full"
                                        >
                                            {s}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function Reviews({ course, reviews, stars }) {
    return (
        <div className="max-w-4xl">
            <SectionHeading icon="fa-star" title="Student reviews" />
            <div className="mt-5 bg-white border border-border rounded-2xl p-6 sm:p-8 mb-6 flex flex-col sm:flex-row items-center gap-8">
                <div className="text-center flex-shrink-0">
                    <p className="text-[56px] font-bold text-dark leading-none m-0">
                        {(course.average_rating || 0).toFixed(1)}
                    </p>
                    <div className="flex items-center justify-center gap-1 mt-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <i key={i} className={`fa fa-star text-[16px] ${i < stars ? 'text-amber-400' : 'text-border'}`} />
                        ))}
                    </div>
                    <p className="text-[12px] text-muted mt-2 m-0">
                        Based on {course.review_count || 0} review{course.review_count === 1 ? '' : 's'}
                    </p>
                </div>
                <div className="hidden sm:block w-px self-stretch bg-border" />
                <div className="flex-1 text-center sm:text-left">
                    <p className="text-[15px] font-semibold text-dark m-0">Verified student feedback</p>
                    <p className="text-[13px] text-muted mt-1.5 leading-relaxed">
                        Ratings come from enrolled students after completing course content, so every score
                        reflects real classroom experience.
                    </p>
                </div>
            </div>

            <div className="space-y-4">
                {reviews.length === 0 ? (
                    <div className="bg-white border border-border rounded-2xl p-10 text-center">
                        <i className="fa fa-comment-dots text-muted text-[28px] mb-3" />
                        <p className="text-[14px] text-muted m-0">
                            No reviews yet. Be the first to share what you think after completing the course.
                        </p>
                    </div>
                ) : reviews.map((r) => (
                    <div key={r.id} className="bg-white border border-border rounded-xl p-5 flex gap-4 hover:shadow-sm transition-shadow">
                        {r.user?.photo ? (
                            <img
                                src={assetUrl(r.user.photo)}
                                alt=""
                                className="w-12 h-12 rounded-full object-cover flex-shrink-0 ring-2 ring-bodybg"
                            />
                        ) : (
                            // No avatar on file (student ratings don't carry a photo) —
                            // show an initial chip instead of a broken image.
                            <div className="w-12 h-12 rounded-full flex-shrink-0 ring-2 ring-bodybg bg-skin/10 text-skin flex items-center justify-center font-semibold uppercase">
                                {(r.user?.name || 'S').charAt(0)}
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3 mb-1.5 flex-wrap">
                                <p className="font-semibold text-dark m-0">{r.user?.name || 'Anonymous'}</p>
                                <div className="flex items-center gap-0.5">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <i key={i} className={`fa fa-star text-[12px] ${i < r.rating ? 'text-amber-400' : 'text-border'}`} />
                                    ))}
                                </div>
                            </div>
                            <p className="text-[14px] text-muted leading-relaxed m-0">{r.review}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Renders while the course-details payload is in flight. Shapes track the
// real layout (hero block, sticky purchase card, tab strip, content lines)
// so the page reflows minimally when data swaps in. Tones use neutral grays
// rather than dark/skin so it reads well on the public-site background.
function CourseDetailsSkeleton() {
    return (
        <div className="max-w-[1280px] mx-auto px-4 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: hero + tabs + body */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Breadcrumb / category chip */}
                    <div className="h-4 w-32 rounded bg-gray-200 animate-pulse" />
                    {/* Title (two lines) */}
                    <div className="h-7 w-11/12 rounded bg-gray-200 animate-pulse" />
                    <div className="h-7 w-2/3 rounded bg-gray-200 animate-pulse" />
                    {/* Rating / instructor / meta strip */}
                    <div className="flex items-center gap-3 pt-1">
                        <div className="h-4 w-24 rounded bg-gray-200 animate-pulse" />
                        <div className="h-4 w-32 rounded bg-gray-200 animate-pulse" />
                        <div className="h-4 w-20 rounded bg-gray-200 animate-pulse" />
                    </div>
                    {/* Hero / preview thumbnail (16:9) */}
                    <div className="aspect-video w-full rounded-lg bg-gray-200 animate-pulse mt-2" />
                    {/* Tab strip */}
                    <div className="flex gap-4 border-b border-border pt-2 pb-2">
                        {[80, 100, 70, 90, 80].map((w, i) => (
                            <div key={i} className="h-4 rounded bg-gray-200 animate-pulse" style={{ width: w }} />
                        ))}
                    </div>
                    {/* Body lines */}
                    <div className="space-y-2 pt-2">
                        <div className="h-4 w-11/12 rounded bg-gray-200 animate-pulse" />
                        <div className="h-4 w-10/12 rounded bg-gray-200 animate-pulse" />
                        <div className="h-4 w-9/12 rounded bg-gray-200 animate-pulse" />
                        <div className="h-4 w-7/12 rounded bg-gray-200 animate-pulse" />
                    </div>
                </div>

                {/* Right: enrolment / price card */}
                <div className="lg:col-span-1">
                    <div className="rounded-lg border border-border p-4 space-y-3 bg-white">
                        {/* Thumbnail */}
                        <div className="aspect-video w-full rounded bg-gray-200 animate-pulse" />
                        {/* Price */}
                        <div className="h-7 w-1/3 rounded bg-gray-200 animate-pulse" />
                        {/* CTA button (full width) */}
                        <div className="h-10 w-full rounded bg-gray-300 animate-pulse" />
                        {/* Meta rows */}
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex items-center justify-between pt-1">
                                <div className="h-3 w-1/3 rounded bg-gray-200 animate-pulse" />
                                <div className="h-3 w-1/4 rounded bg-gray-200 animate-pulse" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
