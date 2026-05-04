import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getAssessment } from "@/api/assessmentApi";
import { getProfile, updatePreScore } from "@/api/authApi";
import { submitPreAssessment } from "@/api/preAssessmentApi";
import { useRef } from "react";


export default function PreAssessment() {
  const hasSubmittedRef = useRef(false);
  const { assessmentId } = useParams();
  const [assessment, setAssessment] = useState<any>(null);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    hasSubmittedRef.current = false;
  }, [assessmentId]);


  const navigate = useNavigate()

  // Defense-in-depth: PreAssessmentPage already gates on collegeId, but a user
  // who URL-types /preassessment/A1 would bypass that. Re-check here and bounce
  // back to the gate page (which will surface the "complete your profile"
  // banner) before we even fetch the assessment.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await getProfile();
        if (!alive) return;
        const cid = (res.data as { collegeId?: string | null })?.collegeId;
        if (!cid || !String(cid).trim()) {
          navigate("/preassessment", { replace: true, state: { incompleteProfile: true } });
        }
      } catch {
        // If profile fetch fails (401 etc.), the existing auth flow will
        // redirect to /login. Don't double-handle here.
      }
    })();
    return () => { alive = false; };
  }, [navigate]);

  useEffect(() => {
  const shouldRedirect = sessionStorage.getItem("ASSESSMENT_AUTO_SUBMIT");

  if (shouldRedirect === "true") {
    sessionStorage.removeItem("ASSESSMENT_AUTO_SUBMIT");
    navigate("/dashboard", { replace: true });
  }
}, [navigate]);



  // 🚀 Fetch assessment data
  useEffect(() => {
    async function fetchAssessment() {
      try {
        const res = await getAssessment(assessmentId);
        setAssessment(res.data);

        const initialTime = res.data.timer || 1800; // default 30 mins
        setTimeLeft(initialTime);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchAssessment();
  }, [assessmentId]);

  const submitAssessment = useCallback(
    async (isTimeOver = false, useBeacon = false) => {
      if (hasSubmittedRef.current || !assessment) return;
      hasSubmittedRef.current = true;

      const totalQuestions = assessment.questions.length;
      let correctCount = 0;

      assessment.questions.forEach((q) => {
        if (answers[q.quesId] === q.correctAns) correctCount++;
      });

      const percentage = ((correctCount / totalQuestions) * 100).toFixed(2);
      const userId = localStorage.getItem("userId");

      const payload = {
        userId,
        assessmentId,
        preScore: Number(percentage),
      };

      try {
        if (useBeacon && navigator.sendBeacon) {
          navigator.sendBeacon(
            "/api/update-pre-score",
            new Blob([JSON.stringify(payload)], {
              type: "application/json",
            })
          );
        } else {
          await updatePreScore(payload);
        }

        // Persist to the gate store so Programs unlock instantly. Failure here
        // doesn't block submission — it just means the unlock happens once the
        // user retakes or the gate falls back to profile.preScore on next load.
        try {
          await submitPreAssessment(Number(percentage));
        } catch (gateErr) {
          console.warn("Pre-assessment gate update failed:", gateErr);
        }

        if (isTimeOver) {
          alert("⏳ Time is over! Test auto-submitted.");
        }

        navigate("/dashboard");
      } catch (err) {
        console.error("Submit failed", err);
      }
    },
    [assessment, answers, assessmentId, navigate]
  );

  useEffect(() => {
  if (!assessment) return;

  const handleBeforeUnload = () => {
    // mark that assessment was auto-submitted
    sessionStorage.setItem("ASSESSMENT_AUTO_SUBMIT", "true");

    submitAssessment(false, true); // sendBeacon
  };

  window.addEventListener("beforeunload", handleBeforeUnload);

  return () => {
    window.removeEventListener("beforeunload", handleBeforeUnload);
  };
}, [assessment, submitAssessment]);



  useEffect(() => {
    if (loading || !assessment) return;

    if (timeLeft === 0) {
      submitAssessment(true);
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, loading, assessment, submitAssessment]);


  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  if (loading) {
  return (
    <div className="p-10 flex justify-center items-center">
      <div className="w-10 h-10 border-4 border-blue-700 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}


  if (!assessment) return <div className="p-10 text-red-500">Assessment not found</div>;

  const questions = assessment.questions || [];

  // 🟦 Submit handler (calculate score + update backend)
  const handleSubmit = () => {
    const confirmed = window.confirm(
      "Are you sure you want to submit?"
    );
    if (confirmed) {
      submitAssessment(false);
    }
  };
  
  return (
    <section className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-3xl mx-auto bg-white shadow-lg rounded-xl p-6">

        {/* ⏳ TIMER */}
        <div
          className={`text-right text-md font-bold mb-6 ${timeLeft > 300 ? "text-black" : "text-red-600"
            }`}
        >
          ⏳ {formatTime(timeLeft)}
        </div>

        {/* QUESTIONS LIST */}
        <div className="space-y-6">
          {questions.map((q: any, index: number) => {
            const opts = Object.values(q.options);

            return (
              <div key={q.quesId} className="p-5 bg-gray-50 border rounded-xl shadow-sm">

                {/* HEADER */}
                <div className="flex justify-between mb-3">
                  <p className="text-lg font-semibold text-gray-800">
                    {index + 1}. {q.question}
                  </p>

                  <span
                    className={`px-2 py-1 text-xs rounded-full ${q.questionSeverity === "easy"
                      ? "bg-green-100 text-green-700"
                      : q.questionSeverity === "medium"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                      }`}
                  >
                    {q.questionSeverity}
                  </span>
                </div>

                {/* OPTIONS */}
                <div className="space-y-2">
                  {opts.map((opt: string, i: number) => (
                    <label
                      key={i}
                      className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition ${answers[q.quesId] === opt
                        ? "bg-teal-50 border-teal-600"
                        : "bg-white border-gray-300 hover:bg-gray-100"
                        }`}
                    >
                      <input
                        type="radio"
                        name={q.quesId}
                        value={opt}
                        checked={answers[q.quesId] === opt}
                        onChange={() =>
                          setAnswers({ ...answers, [q.quesId]: opt })
                        }
                      />
                      <span className="text-gray-700">{opt}</span>
                    </label>
                  ))}
                </div>

              </div>
            );
          })}
        </div>

        {/* SUBMIT */}
        <button
          onClick={handleSubmit}
          className="mt-6 px-6 py-3 bg-[#177385] text-white text-md rounded-lg shadow hover:bg-[#135f6e]"
        >
          Submit Assessment
        </button>
      </div>
    </section>
  );
}
