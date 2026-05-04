import { useEffect, useState } from 'react';
import { findCourseCertificate, issueCourseCertificate } from '@/api/course/courseApi';
import { useAuth } from '@/hooks/useAuth';

// Post-assessment score required to earn a certificate. Tweak here if the
// course threshold changes; keep in sync with Certificate.tsx.
const POST_ASSESSMENT_PASS_THRESHOLD = 50;

const TABS = [
    { key: 'summary', label: 'Summary', icon: 'fa-blog' },
    { key: 'live-class', label: 'Live class', icon: 'fa-video' },
    { key: 'certificate', label: 'Certificate', icon: 'fa-graduation-cap' },
];

export default function PlayerTabs({ course, lesson, progress, completedCount }) {
    const [tab, setTab] = useState('summary');

    return (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-[0_4px_40px_rgba(0,0,0,0.08)]">
            <ul className="flex border-b border-gray-200 overflow-x-auto">
                {TABS.map((t) => (
                    <li key={t.key}>
                        <button
                            type="button"
                            onClick={() => setTab(t.key)}
                            className={`px-5 py-3 flex items-center gap-2 text-[13px] font-medium border-b-2 transition-colors ${
                                tab === t.key ? 'text-gray-900 border-skin' : 'text-gray-500 border-transparent hover:text-gray-900'
                            }`}
                        >
                            <i className={`fa ${t.icon}`} />
                            <span>{t.label}</span>
                        </button>
                    </li>
                ))}
            </ul>
            <div className="p-5 text-gray-800">
                {tab === 'summary' && <SummaryPane lesson={lesson} course={course} progress={progress} completedCount={completedCount} />}
                {tab === 'live-class' && <LiveClassPane />}
                {tab === 'certificate' && <CertificatePane progress={progress} course={course} />}
            </div>
        </div>
    );
}

function SummaryPane({ lesson, course, progress, completedCount }) {
    return (
        <div>
            {lesson?.summary ? (
                <div className="prose-custom text-gray-800" dangerouslySetInnerHTML={{ __html: lesson.summary }} />
            ) : (
                <p className="text-gray-500">No summary available for this lesson.</p>
            )}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Stat label="Sections" value={course.section_count} />
                <Stat label="Lessons" value={course.lesson_count} />
                <Stat label="Completed" value={`${completedCount}/${course.lesson_count}`} />
                <Stat label="Progress" value={`${progress}%`} />
            </div>
        </div>
    );
}

function Stat({ label, value }) {
    return (
        <div className="bg-gray-100 rounded-lg p-3">
            <p className="text-[11px] text-gray-500 uppercase tracking-wide">{label}</p>
            <p className="text-[18px] font-semibold text-gray-900 mt-1">{value}</p>
        </div>
    );
}

function LiveClassPane() {
    return (
        <div className="text-white/70">
            <p className="mb-4">No upcoming live classes are scheduled. Live sessions hosted by the instructor will appear here.</p>
            <button type="button" className="ol-btn-outline" disabled>
                <i className="fa fa-calendar mr-2" />
                Connect Zoom
            </button>
        </div>
    );
}

function CertificatePane({ progress, course }) {
    const { user } = useAuth();
    const postScore = Number(user?.postScore);
    const courseDone = progress >= 100;
    const passed = Number.isFinite(postScore) && postScore >= POST_ASSESSMENT_PASS_THRESHOLD;
    const eligible = courseDone && passed;

    const [cert, setCert] = useState(null);
    const [loading, setLoading] = useState(true);
    const [issuing, setIssuing] = useState(false);
    const [error, setError] = useState(null);

    // Look up an existing certificate for this (user, course) pair so a returning
    // student sees Download immediately. Re-runs whenever eligibility changes.
    useEffect(() => {
        let alive = true;
        setLoading(true);
        setError(null);
        findCourseCertificate(course.id)
            .then((res) => { if (alive) setCert(res?.certificate || null); })
            .catch(() => { if (alive) setCert(null); })
            .finally(() => { if (alive) setLoading(false); });
        return () => { alive = false; };
    }, [course.id, progress, postScore]);

    // Auto-issue only when BOTH gates pass: course complete AND post-assessment passed.
    useEffect(() => {
        if (loading || cert || issuing || !eligible) return;
        setIssuing(true);
        issueCourseCertificate(course.id, 100)
            .then((res) => setCert(res?.certificate || null))
            .catch((err) => setError(err?.response?.data?.error || 'Failed to issue certificate'))
            .finally(() => setIssuing(false));
    }, [eligible, cert, loading, issuing, course.id]);

    // When the student already has a cert, show it regardless of current
    // gate state — they earned it in the past.
    if (!cert && (!courseDone || !passed)) {
        return (
            <div className="text-center py-8">
                <i className="fa fa-graduation-cap text-[48px] text-gray-300 mb-3" />
                <p className="text-gray-700 mb-1">Certificate not yet available</p>
                <ul className="text-[13px] text-gray-500 inline-block text-left mt-2 space-y-1">
                    <li className={courseDone ? 'text-green-600' : ''}>
                        <i className={`fa ${courseDone ? 'fa-check-circle' : 'fa-circle-o'} mr-2`} />
                        Complete the course
                        {!courseDone && <span className="text-gray-400"> (currently {progress}%)</span>}
                    </li>
                    <li className={passed ? 'text-green-600' : ''}>
                        <i className={`fa ${passed ? 'fa-check-circle' : 'fa-circle-o'} mr-2`} />
                        Pass the post-assessment with at least {POST_ASSESSMENT_PASS_THRESHOLD}%
                        {Number.isFinite(postScore) && !passed && (
                            <span className="text-gray-400"> (currently {postScore}%)</span>
                        )}
                        {!Number.isFinite(postScore) && (
                            <span className="text-gray-400"> (not attempted yet)</span>
                        )}
                    </li>
                </ul>
            </div>
        );
    }

    if (loading || issuing) {
        return (
            <div className="text-center py-8 text-gray-500">
                <i className="fa fa-spinner fa-spin text-[24px] mb-2" />
                <p className="text-[13px]">{issuing ? 'Generating your certificate…' : 'Checking certificate…'}</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-8 text-red-600">
                <p className="text-[13px]">{error}</p>
            </div>
        );
    }

    if (!cert) {
        return <div className="text-center py-8 text-gray-500 text-[13px]">No certificate yet.</div>;
    }

    const downloadUrl = `/certificate/${cert.identifier}`;
    return (
        <div className="ol-card p-6 text-center bg-white text-dark border border-gray-200 rounded-xl">
            <i className="fa fa-graduation-cap text-[40px] text-skin mb-3" />
            <h3 className="text-[20px] font-bold mb-2">Certificate of Completion</h3>
            <p className="text-gray-500 mb-4">This certifies that you have successfully completed</p>
            <p className="text-[18px] font-semibold mb-2">{course.title}</p>
            <p className="text-[12px] text-gray-500 mb-6">
                Identifier: <code className="text-skin">{cert.identifier}</code>
            </p>
            <a
                href={downloadUrl}
                target="_blank"
                rel="noreferrer"
                className="ol-btn-primary inline-flex items-center"
            >
                <i className="fa fa-external-link mr-2" />
                View &amp; Download
            </a>
        </div>
    );
}

