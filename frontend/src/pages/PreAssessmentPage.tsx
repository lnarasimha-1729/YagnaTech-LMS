import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardList, Clock, Award, AlertCircle } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getAssessment } from "@/api/assessmentApi";
import { getProfile } from "@/api/authApi";

const PreAssessmentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [profileLoading, setProfileLoading] = useState(true);
  const [collegeId, setCollegeId] = useState<string | null>(null);
  // Show the profile-incomplete banner immediately when PreAssessment.tsx
  // bounces a user back here (state.incompleteProfile === true). Otherwise
  // we wait for them to actually click Start, so first-time visitors aren't
  // greeted by a warning.
  const [showProfileGate, setShowProfileGate] = useState(
    Boolean((location.state as { incompleteProfile?: boolean } | null)?.incompleteProfile)
  );
  const [starting, setStarting] = useState(false);

  // Pull the student's profile once on mount so we know whether their college
  // has been filled in. Pre-assessment results are scoped to a college on the
  // College Admin dashboard — letting a student attempt without a collegeId
  // would orphan the score and silently break that aggregation.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await getProfile();
        if (!alive) return;
        const cid = (res.data as { collegeId?: string | null })?.collegeId;
        setCollegeId(cid && String(cid).trim() ? String(cid).trim() : null);
      } catch {
        if (!alive) return;
        setCollegeId(null);
      } finally {
        if (alive) setProfileLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const startAssessment = async () => {
    if (!collegeId) {
      setShowProfileGate(true);
      return;
    }
    try {
      setStarting(true);
      const assessmentId = "A1";
      const res = await getAssessment(assessmentId);
      navigate(`/preassessment/${assessmentId}`, {
        state: { assessment: res.data },
      });
    } catch (error) {
      console.error(error);
      alert("Failed to start assessment");
    } finally {
      setStarting(false);
    }
  };

  return (
    <section className="min-h-screen flex items-center justify-center bg-gradient-subtle p-6">
      <div className="max-w-3xl w-full">
        {/* Welcome Section */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
            Welcome to YagnaTech!
          </h1>
          <p className="mt-2 text-gray-600">
            Let's get started by evaluating your current knowledge before the program begins.
          </p>
        </div>

        {/* Profile-incomplete banner — shown once the user clicks Start without
            a college on file. We don't show it preemptively so first-time
            visitors aren't greeted by an error message. */}
        {showProfileGate && !collegeId && (
          <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-amber-900 font-semibold">Please complete your profile first</p>
              <p className="text-amber-800 text-sm mt-1">
                Your college isn't set on your profile yet. Add it before attempting the
                pre-assessment so your score is recorded against the right college.
              </p>
              <div className="mt-3">
                <Button
                  onClick={() => navigate("/dashboard?tab=profile")}
                  className="px-4 py-2 text-sm bg-amber-600 text-white hover:bg-amber-700"
                >
                  Go to Profile
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Assessment Info Card */}
        <Card className="rounded-2xl shadow-lg border border-gray-200">
          <CardHeader className="text-center">
            <CardTitle className="text-[#177385] text-2xl font-semibold">
              Pre-Assessment Test
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Instructions */}
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div className="flex flex-col items-center">
                <ClipboardList className="h-8 w-8 text-[#177385] mb-2" />
                <p className="text-gray-700 font-medium">20 Questions</p>
                <p className="text-sm text-gray-500">MCQs & Scenario-based</p>
              </div>
              <div className="flex flex-col items-center">
                <Clock className="h-8 w-8 text-[#177385] mb-2" />
                <p className="text-gray-700 font-medium">30 Minutes</p>
                <p className="text-sm text-gray-500">Complete in one sitting</p>
              </div>
              <div className="flex flex-col items-center">
                <Award className="h-8 w-8 text-[#177385] mb-2" />
                <p className="text-gray-700 font-medium">Program Ready</p>
                <p className="text-sm text-gray-500">Unlock after results</p>
              </div>
            </div>

            {/* Guidelines */}
            <ul className="list-disc list-inside text-gray-600 text-sm space-y-2">
              <li>Make sure you have a stable internet connection.</li>
              <li>Do not refresh or close the window during the test.</li>
              <li>Click "Submit" after answering all questions.</li>
            </ul>

            {/* Start Button — disabled while we're still resolving the profile,
                so a quick click can't slip past the gate. */}
            <div className="flex justify-center pt-4">
              <Button
                onClick={startAssessment}
                disabled={profileLoading || starting}
                className="px-8 py-3 text-lg rounded-xl bg-[#177385] text-white hover:bg-[#135f6e] transition-all shadow-md disabled:opacity-60"
              >
                {profileLoading ? "Loading…" : starting ? "Starting…" : "Start Assessment"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default PreAssessmentPage;
