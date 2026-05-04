import React, { useContext } from 'react';
import { Clock, Award, CheckCircle, Star, Link } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AssessmentContext } from "../context/AssessmentContext";
import { useNavigate } from "react-router-dom"
import { getProfile } from "@/api/authApi"
import { getCourseProgressSummary } from "@/api/course/courseApi"


const Assesments = () => {
  const { assessments, loading } = useContext(AssessmentContext) || {};

  const [profile, setProfile] = React.useState(null);
  const [loadingProfile, setLoadingProfile] = React.useState(true);
  // Course progress gating: Post-Assessment is only unlocked once a course is at 100%.
  const [courseFinished, setCourseFinished] = React.useState(false);
  // Track whether the course-progress fetch has resolved so we don't briefly
  // paint "Locked - Complete Course First" before the real status arrives.
  const [loadingCourseProgress, setLoadingCourseProgress] = React.useState(true);

  React.useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await getProfile();
        setProfile(res.data);
      } catch (err) {
        console.error("Profile fetch error:", err);
      } finally {
        setLoadingProfile(false);
      }
    }

    fetchProfile();
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const userId = localStorage.getItem("userId");
        const summary = await getCourseProgressSummary(userId || undefined);
        if (!cancelled) setCourseFinished(!!summary.completed_any || summary.max_progress >= 100);
      } catch {
        if (!cancelled) setCourseFinished(false);
      } finally {
        if (!cancelled) setLoadingCourseProgress(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Find pre and post assessment for the current user
  const preAssessment = assessments?.find(a => a.type === "pre" && a.setId && a.setId.toLowerCase().includes("ai"));
  const postAssessment = assessments?.find(a => a.type === "post" && a.setId && a.setId.toLowerCase().includes("ai"));

  const navigate = useNavigate()

  const isPreCompleted = profile?.preScore >= 60;
  const isRetakeAllowed = profile?.preScore < 60 && profile?.preScore !== null;

  const isPostCompleted = profile?.postScore !== null && profile?.postScore !== undefined;

  // Enable post only when pre is done, course is 100% complete, AND post not yet taken.
  const isPostEnabled = isPreCompleted && courseFinished && !isPostCompleted;
  
  return (
    <section className="section-padding bg-gradient-subtle py-4">
      <div className="container-ngo">
        {/* Page Heading */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800">
            Assessments
          </h2>
          <p className="mt-2 text-gray-600">
            Test your knowledge before and after completing the program
          </p>
        </div>

        {/* Two Cards Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Pre-Assessment Score */}
          <Card className="rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition-all">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#177385]">
                <Clock className="h-5 w-5" />
                Pre-Assessment Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Here is your score for the Pre-Assessment. Use this to track your progress and identify areas for improvement.
              </p>
              <div className="flex flex-col items-center justify-center mb-6">
                {loadingProfile ? (

                  <div className="w-10 h-10 border-4 border-[#177385] border-t-transparent rounded-full animate-spin"></div>

                ) : profile?.preScore !== null && profile?.preScore !== undefined ? (
                  <>
                    <span className="text-4xl font-bold text-[#177385]">
                      {profile.preScore} / 100
                    </span>
                  </>
                ) : (
                  <span className="text-4xl font-bold text-gray-400">-- / 100</span>
                )}
              </div>
              
              <ul className="space-y-2 text-sm text-gray-700 mb-6">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  Multiple choice questions covering basics
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  Duration: 30 minutes
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  Personalized course recommendations
                </li>
              </ul>
              {/* Hold the button until the profile (and therefore preScore) has
                  loaded. Otherwise it briefly paints "Start Pre-Assessment" before
                  flipping to "Completed" — confusing for returning students. */}
              {loadingProfile ? (
                <Button
                  disabled
                  className="w-full rounded-lg bg-gray-200 text-gray-500 cursor-not-allowed"
                >
                  <span className="inline-block w-4 h-4 mr-2 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  Loading…
                </Button>
              ) : (
                <>
                  <Button
                    onClick={() => navigate("/preassessment")}
                    className={`w-full rounded-lg transition-colors
    ${isPreCompleted
                        ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                        : "bg-[#177385] text-white hover:bg-[#135f6e]"
                      }`}
                    disabled={isPreCompleted}
                  >
                    {isPreCompleted
                      ? "Completed"
                      : isRetakeAllowed
                        ? "Retake Pre-Assessment"
                        : "Start Pre-Assessment"}
                  </Button>
                  {isPreCompleted && (
                    <p className="mt-3 text-center text-sm font-medium text-green-700">
                      You have unlocked the program
                    </p>
                  )}
                </>
              )}

            </CardContent>
          </Card>
          {/* Post-Assessment Score */}
          <Card className="rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition-all">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#177385]">
                <Award className="h-5 w-5" />
                Post-Assessment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Complete the Post-Assessment after finishing the course. Passing
                this assessment will make you eligible for certification.
              </p>
              <div className="flex flex-col items-center justify-center mb-6">
                {loadingProfile ? (
                  <div className="w-10 h-10 border-4 border-[#177385] border-t-transparent rounded-full animate-spin"></div>
                ) : profile?.postScore !== null && profile?.postScore !== undefined ? (
                  <>
                    <span className="text-4xl font-bold text-[#177385]">
                      {profile.postScore} / 100
                    </span>
                  </>
                ) : (
                  <span className="text-4xl font-bold text-gray-400">-- / 100</span>
                )}
              </div>

              <ul className="space-y-2 text-sm text-gray-700 mb-6">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  Final evaluation of course learnings
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  Duration: 45 minutes
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  Required for certificate issuance
                </li>
              </ul>
              {/* Same flicker guard as the Pre-Assessment button: hold until both
                  the profile (post score) AND the course-progress lookup have resolved. */}
              {loadingProfile || loadingCourseProgress ? (
                <Button
                  disabled
                  className="w-full rounded-lg bg-gray-200 text-gray-500 cursor-not-allowed"
                >
                  <span className="inline-block w-4 h-4 mr-2 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  Loading…
                </Button>
              ) : (
                <Button
                  onClick={() => { if (isPostEnabled) navigate("/postassessment"); }}
                  disabled={!isPostEnabled}
                  className={`w-full rounded-lg transition-colors ${
                    isPostEnabled
                      ? "bg-[#177385] text-white hover:bg-[#135f6e]"
                      : "bg-gray-300 text-gray-600 cursor-not-allowed"
                  }`}
                >
                  {isPostCompleted
                    ? "Completed"
                    : !isPreCompleted
                      ? "Locked - Complete Pre-Assessment First"
                      : !courseFinished
                        ? "Locked - Complete Course First"
                        : "Start Post-Assessment"}
                </Button>
              )}
              
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default Assesments;