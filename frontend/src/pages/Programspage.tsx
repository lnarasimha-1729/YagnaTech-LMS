import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getProfile } from "@/api/authApi";
import { getUserProgress } from "@/api/userProgressApi";

interface Category {
  id: number;
  title: string;
  description?: string | null;
}

const ADMIN_BASE = (import.meta.env.VITE_ADMIN_API_URL as string) || "http://localhost:4000";
// Pre-assessment pass threshold. Matches Assesments.jsx so the "Completed" label
// and the Programs unlock stay in sync.
const PRE_ASSESSMENT_PASS = 60;

const ProgramsPage = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Single cached gate status for all programs (existing pre-assessment is global,
  // not per-program). Once the user passes any pre-assessment, every card unlocks.
  const [gatePassed, setGatePassed] = useState<boolean | null>(null);
  // Enrolled target (program_id + player_path). When the current student has
  // already enrolled in a program, the matching card swaps "Start Program" for
  // "Continue" and jumps straight back into the player on click.
  const [enrolledTarget, setEnrolledTarget] = useState<{
    program_id: number; player_path: string;
  } | null>(null);
  // Defer rendering the cards until the enrolled-target lookup has resolved
  // (success OR failure). Otherwise the buttons paint as "Start Program" first
  // and flip to "Continue" once the API returns — confusing for returning students.
  const [progressLoading, setProgressLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await axios.get(`${ADMIN_BASE}/api/public/categories`, { timeout: 30000 });
        if (cancelled) return;
        setCategories(Array.isArray(data?.categories) ? data.categories : []);
      } catch {
        if (!cancelled) setError("Failed to load programs.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // The Pre-Assessment page already writes preScore via auth-service.
        // We read the same profile here so the gate sees what the user actually scored.
        const res = await getProfile();
        const score = Number((res.data as any)?.preScore);
        if (!cancelled) setGatePassed(Number.isFinite(score) && score >= PRE_ASSESSMENT_PASS);
      } catch {
        if (!cancelled) setGatePassed(false);
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

  // "Start Program" goes to the program → course selection flow.
  const handleStart = () => navigate("/programs/select");
  // "Continue" jumps the student straight back into the player exactly where
  // their enrolled course left off (path built by the backend from last_lesson_id).
  const handleContinue = (path: string) => navigate(path);

  return (
    <section className="section-padding bg-gradient-subtle">
      <div className="container-ngo max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold mb-8 text-gray-800">My Programs</h2>

        {(loading || progressLoading) && (
          <div className="flex justify-center py-10">
            <div className="w-10 h-10 border-4 border-[#177385] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {error && !loading && <p className="text-red-600">{error}</p>}
        {!loading && !progressLoading && !error && categories.length === 0 && (
          <p className="text-gray-600">No programs available yet.</p>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {!loading && !progressLoading && categories.map((program) => {
            // Default to locked until the pre-assessment gate has been
            // explicitly resolved as passed. While gatePassed is null
            // (initial mount, network in flight) the button stays
            // disabled — otherwise it briefly appears clickable, which
            // let the student through before the gate check returned.
            const locked = gatePassed !== true;
            // Show "Continue" on the card whose program matches the enrolled
            // target. Other cards keep "Start Program" — student can pick a
            // different program later if the flow allows.
            const isEnrolled = enrolledTarget?.program_id === program.id;
            return (
              <Card
                key={program.id}
                className="rounded-xl shadow-md hover:shadow-lg transition"
              >
                <CardHeader>
                  <CardTitle className="text-[#177385]">{program.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  {program.description && (
                    <p className="text-gray-600 mb-4">{program.description}</p>
                  )}
                  {/* Button is gated on pre-assessment only. Once `locked`
                      flips to false (pre-assessment passed), "Start Program"
                      becomes clickable; if the student is already enrolled
                      in this program, the label switches to "Continue" and
                      jumps them straight back into the player. */}
                  <Button
                    className={
                      locked
                        ? "bg-gray-300 text-gray-600 cursor-not-allowed hover:bg-gray-300"
                        : "bg-[#177385] text-white hover:bg-[#135f6e]"
                    }
                    onClick={
                      locked
                        ? undefined
                        : isEnrolled
                          ? () => handleContinue(enrolledTarget!.player_path)
                          : handleStart
                    }
                    disabled={locked}
                  >
                    {isEnrolled ? "Continue" : "Start Program"}
                  </Button>
                  {locked && (
                    <p className="text-xs text-gray-500 mt-2">
                      Complete Pre-Assessment to unlock
                    </p>
                  )}
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
