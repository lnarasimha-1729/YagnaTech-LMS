import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { getCourseDetails } from '@/api/course/courseApi';
import { enrollCourse } from '@/api/userProgressApi';
import { fmtDuration, currency, safeArr } from '@/components/course/format';
import PreviewModal from '@/components/course/PreviewModal';

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
            <section className="bg-white">
                <div className="max-w-[1280px] mx-auto px-4 py-8">
                    <nav className="text-[13px] mb-4">
                        <Link to="/" className="breadcrumb-link">Home</Link>
                        <span className="mx-2 text-muted">/</span>
                        <span className="text-dark">{course.title}</span>
                    </nav>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2">
                            <h1 className="text-[28px] sm:text-[32px] font-bold text-dark leading-tight mb-3">{course.title}</h1>
                            <p className="text-[15px] text-muted ellipsis-2 mb-5">{course.short_description}</p>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-[13px] text-dark">
                                {course.creator && (
                                    <div className="flex items-center gap-2">
                                        <img src={course.creator.photo} alt="" className="w-8 h-8 rounded-full object-cover" />
                                        <span>{course.creator.name}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2">
                                    {course.review_count > 0 ? (
                                        <>
                                            <span>{course.average_rating.toFixed(1)}</span>
                                            {Array.from({ length: 5 }).map((_, i) => (
                                                <i key={i} className={`fa fa-star text-[12px] ${i < stars ? 'text-amber-400' : 'text-border'}`} />
                                            ))}
                                        </>
                                    ) : (
                                        <>
                                            <span>0</span>
                                            <i className="fa fa-star text-border text-[12px]" />
                                        </>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <i className="fa fa-language text-muted" />
                                    <span className="capitalize">{course.language}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <i className="fa fa-graduation-cap text-muted" />
                                    <span>Certificate Course</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <i className="fa fa-users text-muted" />
                                    <span>{course.enrolled} Students</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <i className="fa fa-clock text-muted" />
                                    <span>{fmtDuration(course.total_duration_secs)}</span>
                                </div>
                            </div>
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
            <section className="border-t border-border">
                <div className="max-w-[1280px] mx-auto px-4 py-8">
                    <div className="flex gap-2 border-b border-border mb-6 overflow-x-auto">
                        {TABS.map((t) => (
                            <button
                                key={t.key}
                                type="button"
                                className={`ol-tab ${tab === t.key ? 'active' : ''}`}
                                onClick={() => setTab(t.key)}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {tab === 'overview' && <Overview course={course} outcomes={outcomes} faqs={faqs} />}
                    {tab === 'curriculum' && <Curriculum course={course} />}
                    {tab === 'details' && <Details requirements={requirements} outcomes={outcomes} />}
                    {tab === 'instructor' && <Instructor instructor={course.creator} />}
                    {tab === 'reviews' && <Reviews course={course} reviews={reviews} stars={stars} />}
                </div>
            </section>

            {preview && course.preview && (
                <PreviewModal src={course.preview} onClose={() => setPreview(false)} />
            )}
        </>
    );
}

function PricingCard({ course, onPreview, onEnroll, enrolling }) {
    return (
        <div className="lg:col-span-1">
            <div className="ol-card overflow-hidden sticky top-[80px]">
                <button type="button" onClick={onPreview} className="block relative w-full aspect-video-shell bg-bodybg group">
                    <img src={course.banner || course.thumbnail} alt="" className="w-full h-full object-cover" />
                    {course.preview && (
                        <span className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
                            <span className="w-14 h-14 rounded-full bg-white text-skin flex items-center justify-center shadow">
                                <i className="fa fa-play text-[18px]" />
                            </span>
                        </span>
                    )}
                </button>
                <div className="p-5">
                    <div className="mb-4">
                        {course.is_paid === 0 ? (
                            <span className="text-[28px] font-bold text-skin">Free</span>
                        ) : course.discount_flag ? (
                            <p className="m-0">
                                <span className="text-[28px] font-bold text-dark">{currency(course.discounted_price)}</span>{' '}
                                <del className="text-muted text-[16px]">{currency(course.price)}</del>
                            </p>
                        ) : (
                            <span className="text-[28px] font-bold text-dark">{currency(course.price)}</span>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={onEnroll}
                        disabled={enrolling}
                        className="ol-btn-primary w-full"
                    >
                        {enrolling
                            ? 'Loading…'
                            : (course.is_paid === 0 ? 'Start Learning' : 'Enroll Now')}
                    </button>
                    <ul className="mt-5 space-y-2 text-[13px] text-muted">
                        <li className="flex items-center gap-2"><i className="fa fa-check text-skin" />{course.lesson_count} lessons</li>
                        <li className="flex items-center gap-2"><i className="fa fa-check text-skin" />{course.section_count} sections</li>
                        <li className="flex items-center gap-2"><i className="fa fa-check text-skin" />{fmtDuration(course.total_duration_secs)} total</li>
                        <li className="flex items-center gap-2"><i className="fa fa-check text-skin" />Lifetime access</li>
                        <li className="flex items-center gap-2"><i className="fa fa-check text-skin" />Certificate of completion</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

function Overview({ course, outcomes, faqs }) {
    return (
        <div className="space-y-8">
            {outcomes.length > 0 && (
                <div>
                    <h3 className="text-[18px] font-semibold text-dark mb-3">What you'll learn</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {outcomes.map((o, i) => (
                            <div key={i} className="flex items-start gap-2 text-[14px] text-dark">
                                <i className="fa fa-check text-skin mt-1" />
                                <span>{o}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div>
                <h3 className="text-[18px] font-semibold text-dark mb-3">Description</h3>
                <div className="text-[14px] text-dark leading-relaxed prose-custom" dangerouslySetInnerHTML={{ __html: course.description || '' }} />
            </div>

            {faqs.length > 0 && (
                <div>
                    <h3 className="text-[18px] font-semibold text-dark mb-3">FAQs</h3>
                    <div className="space-y-3">
                        {faqs.map((f, i) => (
                            <details key={i} className="ol-card group">
                                <summary className="cursor-pointer p-4 font-medium text-dark flex items-center justify-between">
                                    <span>{f.title}</span>
                                    <i className="fa fa-chevron-down text-muted group-open:rotate-180 transition-transform" />
                                </summary>
                                <div className="px-4 pb-4 text-[14px] text-muted">{f.description}</div>
                            </details>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function Curriculum({ course }) {
    return (
        <div className="space-y-3">
            {course.sections.map((sec, idx) => (
                <details key={sec.id} className="ol-card" open={idx === 0}>
                    <summary className="cursor-pointer p-4 flex items-center justify-between">
                        <span className="font-semibold text-dark">{sec.title}</span>
                        <span className="text-[12px] text-muted">{sec.lessons.length} lessons</span>
                    </summary>
                    <ul className="border-t border-border divide-y divide-border">
                        {sec.lessons.map((l) => (
                            <li key={l.id} className="px-4 py-3 flex items-center justify-between">
                                <div className="flex items-center gap-3 text-[14px]">
                                    <LessonTypeIcon type={l.lesson_type} />
                                    <span className="text-dark">{l.title}</span>
                                    {l.is_free === 1 && <span className="text-[10px] uppercase font-semibold text-skin border border-skin rounded px-1.5 py-0.5">Free</span>}
                                </div>
                                {l.duration && l.duration !== '00:00:00' && (
                                    <span className="text-[12px] text-muted">{l.duration}</span>
                                )}
                            </li>
                        ))}
                    </ul>
                </details>
            ))}
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
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
                <h3 className="text-[18px] font-semibold text-dark mb-3">Requirements</h3>
                <ul className="list-disc pl-5 space-y-1 text-[14px]">
                    {requirements.length === 0 ? <li className="text-muted">No specific requirements.</li> : requirements.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
            </div>
            <div>
                <h3 className="text-[18px] font-semibold text-dark mb-3">Outcomes</h3>
                <ul className="list-disc pl-5 space-y-1 text-[14px]">
                    {outcomes.length === 0 ? <li className="text-muted">No outcomes listed.</li> : outcomes.map((o, i) => <li key={i}>{o}</li>)}
                </ul>
            </div>
        </div>
    );
}

function Instructor({ instructor }) {
    if (!instructor) return <p className="text-muted">Instructor info not available.</p>;
    return (
        <div className="ol-card p-6 flex flex-col sm:flex-row gap-6">
            <img src={instructor.photo} alt="" className="w-32 h-32 rounded-full object-cover flex-shrink-0 mx-auto sm:mx-0" />
            <div>
                <h3 className="text-[20px] font-semibold text-dark">{instructor.name}</h3>
                <p className="text-[13px] text-muted mb-3">{instructor.about}</p>
                <div className="text-[14px] text-dark leading-relaxed" dangerouslySetInnerHTML={{ __html: instructor.biography || '' }} />
                {instructor.skills && (
                    <div className="mt-4">
                        <p className="text-[13px] text-muted mb-1">Skills</p>
                        <div className="flex flex-wrap gap-2">
                            {String(instructor.skills).split(',').map((s, i) => (
                                <span key={i} className="text-[12px] bg-lightgreen text-skin px-2 py-1 rounded">{s.trim()}</span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function Reviews({ course, reviews, stars }) {
    return (
        <div>
            <div className="ol-card p-6 mb-6 flex flex-col sm:flex-row items-center gap-6">
                <div className="text-center">
                    <p className="text-[44px] font-bold text-dark leading-none">{course.average_rating.toFixed(1)}</p>
                    <div className="flex items-center justify-center gap-1 mt-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <i key={i} className={`fa fa-star ${i < stars ? 'text-amber-400' : 'text-border'}`} />
                        ))}
                    </div>
                    <p className="text-[12px] text-muted mt-1">{course.review_count} review{course.review_count === 1 ? '' : 's'}</p>
                </div>
                <p className="text-[14px] text-muted">Ratings come from enrolled students after completing course content.</p>
            </div>

            <div className="space-y-4">
                {reviews.length === 0 ? (
                    <p className="text-muted">No reviews yet.</p>
                ) : reviews.map((r) => (
                    <div key={r.id} className="ol-card p-4 flex gap-4">
                        <img src={r.user?.photo} alt="" className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                                <p className="font-semibold text-dark">{r.user?.name || 'Anonymous'}</p>
                                <div className="flex items-center gap-1">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <i key={i} className={`fa fa-star text-[11px] ${i < r.rating ? 'text-amber-400' : 'text-border'}`} />
                                    ))}
                                </div>
                            </div>
                            <p className="text-[14px] text-muted">{r.review}</p>
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
