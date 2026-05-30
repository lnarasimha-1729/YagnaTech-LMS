import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { getProfile } from "@/api/authApi";
import { getUserProgress } from "@/api/userProgressApi";

// Course shape returned by /api/public/courses?clgId=… (subset we use for
// the card view; the list endpoint returns lesson_count/section_count = 0
// because it doesn't hydrate sections — the details page does that).
interface CourseCard {
  id: number;
  slug: string;
  title: string;
  short_description?: string;
  thumbnail?: string;
  banner?: string;
  level?: string;
  language?: string;
  lesson_count?: number;
  completed_lesson_count?: number;
  progress_pct?: number;
}

const ADMIN_BASE = (import.meta.env.VITE_ADMIN_API_URL as string) || "http://localhost:4000";
// Pre-assessment pass threshold. Matches Assesments.jsx so the "Completed"
// label and the My Courses unlock stay in sync.
const PRE_ASSESSMENT_PASS = 60;

const ProgramsPage = () => {
  const navigate = useNavigate();
  // Courses are now sourced directly from /api/public/courses?clgId=<student's
  // college>, mirroring how categories used to surface for the student's
  // college. The category cards layer has been removed (the admin form maps
  // courses straight to colleges via clg_ids).
  const [courses, setCourses] = useState<CourseCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Single cached gate status (existing pre-assessment is global, not
  // Course cards on My Courses unlock once the student passes the
  // pre-assessment (preScore >= PRE_ASSESSMENT_PASS). The per-program
  // gate (accept) lives on the next page (ProgramsForCourse) so the
  // student CAN land here from any path and still see their courses,
  // even before any program request was sent. null while the profile
  // lookup is in flight.
  const [gatePassed, setGatePassed] = useState<boolean | null>(null);
  // Has the student picked a college on their Profile? Until this is true,
  // My Courses renders an empty-state CTA instead of any course cards —
  // the spec requires zero exposure of catalog content pre-college.
  const [hasCollege, setHasCollege] = useState<boolean | null>(null);
  // Enrolled target (program_id + player_path). When the current student has
  // already enrolled, the "Continue" jump shows on every card so they can land
  // back in the player no matter which one they click — there's no per-course
  // enrollment record on this payload.
  const [enrolledTarget, setEnrolledTarget] = useState<{
    program_id: number; player_path: string;
  } | null>(null);
  // Defer rendering the cards until the enrolled-target lookup has resolved
  // (success OR failure). Otherwise the buttons paint as "Start" first
  // and flip to "Continue" once the API returns — confusing for returning students.
  const [progressLoading, setProgressLoading] = useState(true);

  // Single mount effect: resolve the student's profile first (preScore +
  // collegeId), then fetch courses SCOPED to that college. Courses are only
  // fetched when a college is set — the spec requires zero catalog exposure
  // before the student picks one.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let clgId = "";
      try {
        const res = await getProfile();
        const data = (res.data as any) || {};
        clgId = (data.collegeId as string) || "";
        const score = Number(data.preScore);
        if (!cancelled) {
          setHasCollege(Boolean(clgId));
          setGatePassed(Number.isFinite(score) && score >= PRE_ASSESSMENT_PASS);
        }
      } catch {
        if (!cancelled) {
          setHasCollege(false);
          setGatePassed(false);
          setLoading(false);
        }
        return;
      }

      // No college → don't hit the courses endpoint. The empty-state CTA
      // handles this case.
      if (!clgId) {
        if (!cancelled) setLoading(false);
        return;
      }

      try {
        // user_id (read from localStorage like the other student-facing
        // public endpoints) lets the backend narrow college-scoped courses
        // to ones linked to the student's batch. Omitting it falls back to
        // the prior college-only behavior.
        const userId = localStorage.getItem("userId") || undefined;
        const { data } = await axios.get(`${ADMIN_BASE}/api/public/courses`, {
          params: userId ? { clgId, user_id: userId } : { clgId },
          headers: userId ? { "x-user-id": String(userId) } : undefined,
          timeout: 30000,
        });
        if (cancelled) return;
        const rows: CourseCard[] = Array.isArray(data?.data) ? data.data : [];
        setCourses(rows);
      } catch {
        if (!cancelled) setError("Failed to load courses.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Persistence: pull the enrolled target (program_id + player_path) so the
  // matching card shows "Continue" instead of "Start Program". The page itself
  // stays put — clicking Continue is what jumps into the player.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { target } = await getUserProgress();
        if (!cancelled && target?.player_path && target?.program_id) {
          setEnrolledTarget({ program_id: target.program_id, player_path: target.player_path });
        }
      } catch {
        // No progress yet — render the program list normally.
      } finally {
        if (!cancelled) setProgressLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Course cards now route to the programs-for-course page first, so the
  // student sees the programs an admin attached to this course (for their
  // college) before landing on the details/player. The details page is still
  // reachable from the "View More" CTA on each program card.
  const handleStart = (slug: string) =>
    navigate(`/courses/programs/for-course?slug=${encodeURIComponent(slug)}`);
  // "Continue" jumps the student straight back into the player exactly where
  // their enrolled course left off (path built by the backend from last_lesson_id).
  const handleContinue = (path: string) => navigate(path);

  // Resolve a thumbnail URL. The list endpoint returns relative paths
  // (e.g. uploads/course-thumbnail/...) — prepend the admin-service base.
  const thumbUrl = (c: CourseCard) => {
    const raw = c.thumbnail || c.banner || "";
    if (!raw) return "";
    if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
    return `${ADMIN_BASE}/${raw.replace(/^\/+/, "")}`;
  };

  return (
    <section className="section-padding bg-gradient-subtle">
      <div className="container-ngo max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold mb-8 text-gray-800">My Courses</h2>

        {/* Wait until we know the college gate state before rendering anything
            below — otherwise the cards flash for one frame on slower networks. */}
        {(loading || progressLoading || hasCollege === null) && (
          <div className="flex justify-center py-10">
            <div className="w-10 h-10 border-4 border-[#177385] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {error && !loading && <p className="text-red-600">{error}</p>}

        {/* College gate. The spec is "show nothing until the student picks
            a college in Profile." We render an actionable empty state with
            a deep link to the Profile tab instead of a generic message so
            the user knows exactly where to go next. */}
        {!loading && !progressLoading && hasCollege === false && (
          <Card className="rounded-xl shadow-md border-dashed border-2">
            <CardContent className="p-8 text-center space-y-4">
              <h3 className="text-xl font-semibold text-gray-800">
                Select your college to see your courses
              </h3>
              <p className="text-gray-600">
                Your courses are personalised to the college you study at.
                Open your profile and pick your college to unlock this section.
              </p>
            </CardContent>
          </Card>
        )}

        {!loading && !progressLoading && hasCollege === true && !error && courses.length === 0 && (
          <p className="text-gray-600">No courses available for your college yet.</p>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {!loading && !progressLoading && hasCollege === true && courses.map((course) => {
            // A card unlocks when the student has passed the pre-assessment
            // (preScore >= PRE_ASSESSMENT_PASS). The per-program accept gate
            // lives on the next page (ProgramsForCourse) — once a course is
            // open the student picks WHICH program to enroll through, and
            // that's where the program_requests.status === 'accepted' check
            // applies.
            const locked = gatePassed !== true;
            // Per-course enrolment isn't on this list payload, so we use the
            // global enrolled target: if the student has an active enrolment,
            // every card swaps to "Continue" and jumps back into the player.
            const isEnrolled = enrolledTarget !== null;
            const thumb = thumbUrl(course);
            return (
              <Card
                key={course.id}
                className="rounded-xl shadow-md hover:shadow-lg transition overflow-hidden"
              >
                {thumb && (
                  <button
                    type="button"
                    onClick={
                      locked
                        ? undefined
                        : isEnrolled
                          ? () => handleContinue(enrolledTarget!.player_path)
                          : () => handleStart(course.slug)
                    }
                    disabled={locked}
                    className="block w-full aspect-[16/9] max-h-44 bg-gray-100 overflow-hidden disabled:cursor-not-allowed"
                    aria-label={isEnrolled ? "Continue course" : "Open course"}
                  >
                    <img
                      src={thumb}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  </button>
                )}
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="text-[#177385] text-base leading-snug line-clamp-2">{course.title}</CardTitle>
                    {/* Bare arrow — gated on pre-assessment. Disabled until
                        `locked` flips false; opens the course details, or
                        jumps straight back into the player when enrolled. */}
                    <button
                      type="button"
                      className={
                        locked
                          ? "shrink-0 bg-transparent border-0 p-0 text-gray-400 cursor-not-allowed"
                          : "shrink-0 bg-transparent border-0 p-0 text-[#177385] hover:text-[#135f6e] cursor-pointer"
                      }
                      onClick={
                        locked
                          ? undefined
                          : isEnrolled
                            ? () => handleContinue(enrolledTarget!.player_path)
                            : () => handleStart(course.slug)
                      }
                      disabled={locked}
                      aria-label={isEnrolled ? "Continue course" : "Open course"}
                      title={isEnrolled ? "Continue course" : "Open course"}
                    >
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </CardHeader>
                <CardContent>
                  {course.short_description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {course.short_description}
                    </p>
                  )}
                  {locked ? (
                    <p className="text-xs text-gray-500 mt-3">
                      Complete Pre-Assessment to unlock
                    </p>
                  ) : (() => {
                    // Donut progress — server-computed pct from
                    // lesson_completions / total lessons, so it stays in sync
                    // with what the player records when a lesson is watched.
                    const pct = Math.max(0, Math.min(100, Number(course.progress_pct) || 0));
                    const done = Number(course.completed_lesson_count) || 0;
                    const total = Number(course.lesson_count) || 0;
                    const isComplete = total > 0 && pct >= 100;
                    const notStarted = done === 0;
                    const SIZE = 40;
                    const STROKE = 4;
                    const RADIUS = (SIZE - STROKE) / 2;
                    const CIRC = 2 * Math.PI * RADIUS;
                    const dashOffset = CIRC * (1 - pct / 100);
                    const ringColor = isComplete ? "#059669" : "#177385";
                    const ringGlow = isComplete ? "#34d399" : "#1f8a9f";
                    const gradId = `cp-grad-${course.id}`;
                    return (
                      <div className="mt-3 flex items-center gap-3">
                        <div
                          className="relative shrink-0"
                          style={{ width: SIZE, height: SIZE }}
                          role="progressbar"
                          aria-valuenow={pct}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`Course progress: ${pct}%`}
                        >
                          <svg
                            width={SIZE}
                            height={SIZE}
                            viewBox={`0 0 ${SIZE} ${SIZE}`}
                            className="-rotate-90"
                          >
                            <defs>
                              <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor={ringGlow} />
                                <stop offset="100%" stopColor={ringColor} />
                              </linearGradient>
                            </defs>
                            <circle
                              cx={SIZE / 2}
                              cy={SIZE / 2}
                              r={RADIUS}
                              fill="none"
                              stroke="#eef2f5"
                              strokeWidth={STROKE}
                            />
                            <circle
                              cx={SIZE / 2}
                              cy={SIZE / 2}
                              r={RADIUS}
                              fill="none"
                              stroke={`url(#${gradId})`}
                              strokeWidth={STROKE}
                              strokeLinecap="round"
                              strokeDasharray={CIRC}
                              strokeDashoffset={dashOffset}
                              style={{ transition: "stroke-dashoffset 600ms ease" }}
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            {isComplete ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <span className="text-[10px] font-bold text-[#177385] leading-none">
                                {pct}
                                <span className="text-[7px] font-semibold">%</span>
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="min-w-0">
                          <p className={
                            isComplete
                              ? "text-xs font-semibold text-emerald-700"
                              : "text-xs font-semibold text-gray-800"
                          }>
                            {isComplete
                              ? "Course completed"
                              : notStarted
                                ? "Not started yet"
                                : "Your progress"}
                          </p>
                          {total > 0 && (
                            <p className="text-[11px] text-gray-500 mt-0.5">
                              {done} of {total} lesson{total === 1 ? "" : "s"} completed
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ProgramsPage;
