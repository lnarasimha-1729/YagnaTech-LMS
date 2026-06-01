import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
    Globe2,
    GraduationCap,
    Building2,
    Rocket,
    BookOpen,
    Brain,
    Briefcase,
    Award,
    LucideIcon,
} from "lucide-react";
import ProgramCard from "@/components/programs/ProgramCard";
import { getProfile } from "@/api/authApi";
import { getCourseDetails } from "@/api/course/courseApi";
import { enrollCourse } from "@/api/userProgressApi";
import { getAcceptedProgram } from "@/api/programRequestApi";

// Map the admin-stored icon name (e.g. "Globe2") to the actual lucide-react
// component. Mirrors the curated set the admin ProgramForm picker exposes.
const ICON_MAP: Record<string, LucideIcon> = {
    Globe2,
    GraduationCap,
    Building2,
    Rocket,
    BookOpen,
    Brain,
    Briefcase,
    Award,
};

interface ProgramRow {
    id: number;
    title: string;
    tagline?: string | null;
    icon?: string | null;
    features?: unknown;
    clg_ids?: unknown;
    course_ids?: unknown;
    course_id?: number | null;
}

interface CourseSummary {
    id: number;
    title: string;
    slug: string;
}

const ADMIN_BASE = (import.meta.env.VITE_ADMIN_API_URL as string) || "http://localhost:4000";

// Parse `features` defensively — Sequelize JSON columns usually arrive as a
// real array, but a stringified array slips through some serialisations.
const parseFeatures = (raw: unknown): string[] => {
    if (Array.isArray(raw)) return raw.map(String);
    if (typeof raw === "string") {
        try {
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed.map(String) : [];
        } catch {
            return [];
        }
    }
    return [];
};

const ProgramsForCourse = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const slug = (searchParams.get("slug") || "").trim();

    const [course, setCourse] = useState<CourseSummary | null>(null);
    const [programs, setPrograms] = useState<ProgramRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hasCollege, setHasCollege] = useState<boolean | null>(null);
    // The program the student has accepted (program_requests.status =
    // 'accepted'). A card's Enroll button is enabled ONLY when its title
    // matches this value. Refreshed on a custom 'program-request-accepted'
    // event + tab visibility, so accepting in another part of the dashboard
    // unlocks the card without a hard reload.
    const [acceptedProgram, setAcceptedProgram] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            if (!slug) {
                if (!cancelled) {
                    setError("Course not specified.");
                    setLoading(false);
                }
                return;
            }

            // Resolve the student's college so we can filter the programs list
            // server-side. With no clgId we won't have a college to filter by,
            // so we render the gated empty state.
            let clgId = "";
            try {
                const res = await getProfile();
                // collegeId isn't on the typed ProfileResponse (auth-service
                // augments the payload at runtime). Cast through `any` —
                // mirrors how Programspage reads the same field.
                clgId = ((res.data as any)?.collegeId as string) || "";
                if (!cancelled) setHasCollege(Boolean(clgId));
            } catch {
                if (!cancelled) setHasCollege(false);
            }

            // Resolve the course by slug so we can both display its title
            // and pass its id to the programs filter.
            try {
                const detail = await getCourseDetails(slug);
                if (cancelled) return;
                const c = detail?.course;
                if (!c?.id) {
                    setError("Course not found.");
                    setLoading(false);
                    return;
                }
                setCourse({ id: Number(c.id), title: String(c.title || ""), slug });
            } catch {
                if (!cancelled) {
                    setError("Failed to load the course.");
                    setLoading(false);
                }
                return;
            }

            if (!clgId) {
                if (!cancelled) setLoading(false);
                return;
            }
        })();
        return () => { cancelled = true; };
    }, [slug]);

    // Pull the accepted program. Same listener pattern My Courses uses so
    // accepting on the dashboard banner unlocks the matching card here
    // without a hard refresh.
    useEffect(() => {
        let cancelled = false;
        const refetch = () => {
            getAcceptedProgram()
                .then((p) => { if (!cancelled) setAcceptedProgram(p); })
                .catch(() => { /* keep existing value */ });
        };
        refetch();

        const onVisible = () => {
            if (document.visibilityState === 'visible') refetch();
        };
        const onCustom = () => refetch();

        document.addEventListener('visibilitychange', onVisible);
        window.addEventListener('focus', onCustom);
        window.addEventListener('program-request-accepted', onCustom);

        return () => {
            cancelled = true;
            document.removeEventListener('visibilitychange', onVisible);
            window.removeEventListener('focus', onCustom);
            window.removeEventListener('program-request-accepted', onCustom);
        };
    }, []);

    // Once we have both the resolved course AND the student's clgId, fetch
    // the programs that match this (course, college) pair. Backend filter does
    // the heavy lifting — see /api/public/programs in server.js.
    useEffect(() => {
        let cancelled = false;
        if (!course?.id || !hasCollege) return;
        (async () => {
            try {
                let clgId = "";
                try {
                    const res = await getProfile();
                    clgId = ((res.data as any)?.collegeId as string) || "";
                } catch { /* handled by hasCollege flag */ }

                // user_id lets the backend narrow by the student's batch in
                // addition to college + course. Read from localStorage same
                // way the other student-facing /api/public callers do.
                const userId = localStorage.getItem("userId") || undefined;
                const { data } = await axios.get(`${ADMIN_BASE}/api/public/programs`, {
                    params: userId
                        ? { clgId, course_id: course.id, user_id: userId }
                        : { clgId, course_id: course.id },
                    headers: userId ? { "x-user-id": String(userId) } : undefined,
                    timeout: 30000,
                });
                if (cancelled) return;
                const rows: ProgramRow[] = Array.isArray(data?.programs) ? data.programs : [];
                setPrograms(rows);
            } catch {
                if (!cancelled) setError("Failed to load programs.");
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [course?.id, hasCollege]);

    const cards = useMemo(
        () => programs.map((p) => ({
            id: p.id,
            title: String(p.title || ""),
            tagline: String(p.tagline || ""),
            features: parseFeatures(p.features),
            icon: (p.icon && ICON_MAP[p.icon]) || Globe2,
        })),
        [programs],
    );

    // Enroll click → record the enrollment NOW, then land on the course-details
    // page with the program id attached. Writing /user-progress/enroll-course
    // here (rather than only later on the details page) means the course's
    // enrollment count increments the moment the student clicks Enroll on the
    // program card. The write is idempotent — the backend upserts the single
    // (user_id, program_id) row — so re-clicking doesn't double-count, and the
    // distinct-user count on the course-details page stays accurate.
    //
    // The enroll write is best-effort: if it fails we still navigate (matching
    // the prior behaviour) and CourseDetails's handleEnroll retries the same
    // POST from the program_id in the URL.
    const handleView = async (programId?: number) => {
        if (!course?.slug) return;
        if (programId && course.id) {
            try {
                await enrollCourse(programId, course.id);
            } catch {
                /* non-fatal — navigation + the details-page enroll retry cover it */
            }
        }
        const params = new URLSearchParams({ slug: course.slug });
        if (programId) params.set('program_id', String(programId));
        navigate(`/courses/programs/course-details?${params.toString()}`);
    };

    return (
        <section className="bg-gradient-subtle pt-4 pb-12">
            <div className="container-ngo max-w-6xl mx-auto px-4">
                <h2 className="text-3xl md:text-4xl font-bold mb-2 text-gray-800 text-center">
                    {course?.title ? `Programs for ${course.title}` : "Programs"}
                </h2>
                <p className="text-gray-600 mb-8 text-center">
                    These are the programs available for this course at your college. Pick one to view details.
                </p>

                {loading && (
                    <div className="flex justify-center py-10">
                        <div className="w-10 h-10 border-4 border-[#177385] border-t-transparent rounded-full animate-spin" />
                    </div>
                )}

                {error && !loading && (
                    <p className="text-red-600 text-center">{error}</p>
                )}

                {!loading && hasCollege === false && (
                    <p className="text-gray-600 text-center">
                        Your account isn't linked to a college yet. Contact your admin.
                    </p>
                )}

                {!loading && !error && hasCollege === true && cards.length === 0 && (
                    <p className="text-gray-600 text-center">
                        No programs have been added for this course at your college yet.
                    </p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {!loading && cards.map((p) => {
                        // Enroll only on the card whose title matches what
                        // the student accepted (program_requests.status =
                        // 'accepted'). Every other card stays locked until
                        // the admin sends + the student accepts that program.
                        const unlocked = !!acceptedProgram && p.title === acceptedProgram;
                        return (
                            <ProgramCard
                                key={p.id}
                                program={p}
                                ctaLabel="Enroll"
                                disabled={!unlocked}
                                disabledLabel={
                                    acceptedProgram
                                        ? 'Locked'
                                        : 'Waiting for admin approval'
                                }
                                onView={(program) => handleView(Number(program.id))}
                            />
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default ProgramsForCourse;
