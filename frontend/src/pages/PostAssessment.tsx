import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getAssessment } from "@/api/assessmentApi";
import { updatePostScore } from "@/api/authApi";

export default function PostAssessment() {
  const { assessmentId } = useParams();
  const [assessment, setAssessment] = useState<any>(null);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  // 🚀 Fetch assessment data
  useEffect(() => {
    async function fetchAssessment() {
      try {
        const res = await getAssessment(assessmentId);
        setAssessment(res.data);

        const initialTime = res.data.timer || 1800;
        setTimeLeft(initialTime);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchAssessment();
  }, [assessmentId]);

  // ⏱ Auto-submit when time reaches 0
  useEffect(() => {
    if (loading) return;

    if (timeLeft === 0) {
  autoSubmit(true); // show "time is over" ONLY when timer ends
  return;
}


    const interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timeLeft, loading]);


  // 🔥 Auto-submit logic (NO confirmation)
  const autoSubmit = async (isTimeOver = false) => {
  if (!assessment || !assessment.questions) return;

  const totalQuestions = assessment.questions.length;
  const totalScore = assessment.score;

  let correctCount = 0;

  assessment.questions.forEach((q) => {
    if (answers[q.quesId] === q.correctAns) correctCount++;
  });

  const marksPerQuestion = totalScore / totalQuestions;
  const obtainedScore = correctCount * marksPerQuestion;
  const percentage = (obtainedScore / totalScore) * 100;

  try {
    const userId = localStorage.getItem("userId");

    await updatePostScore({
      userId,
      postScore: Number(percentage.toFixed(2)),
    });

    if (isTimeOver) {
      alert("⏳ Time is over! Your assessment has been auto-submitted.");
    }

    navigate("/dashboard");

  } catch (err) {
    console.error("Auto submit failed:", err);
    alert("Failed to auto-submit.");
  }
};



  // ⛔ Prevent browser back button / refresh
  useEffect(() => {
    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };

    const handlePopState = () => {
      const confirmed = window.confirm(
        "Are you sure you want to leave? Your test will be marked as over."
      );

      if (!confirmed) {
        window.history.pushState(null, "", window.location.href);
      } else {
        autoSubmit(false); // manual submit → NO alert

      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);

    window.history.pushState(null, "", window.location.href);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);


  // Format Timer
  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };


  if (loading) {
    return (
      <div className="p-10 flex justify-center items-center">
        <div className="w-10 h-10 border-4 border-[#177385] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!assessment) return <div className="p-10 text-red-500">Assessment not found</div>;

  const questions = assessment.questions || [];

  // 🟦 Manual Submit with Confirmation
  const handleSubmit = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to submit? You cannot change your answers."
    );
    if (!confirmed) return;

    autoSubmit(); // reuse auto-submit function
  };

  return (
    <section className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-3xl mx-auto bg-white shadow-lg rounded-xl p-6">

        {/* ⏳ TIMER */}
        <div className={`text-right text-md font-bold mb-6 ${timeLeft > 300 ? "text-black" : "text-red-600"}`}>
          ⏳ {formatTime(timeLeft)}
        </div>

        {/* QUESTIONS */}
        <div className="space-y-6">
          {questions.map((q: any, index: number) => {
            const opts = Object.values(q.options);

            return (
              <div key={q.quesId} className="p-5 bg-gray-50 border rounded-xl shadow-sm">
                <div className="flex justify-between mb-3">
                  <p className="text-lg font-semibold text-gray-800">
                    {index + 1}. {q.question}
                  </p>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      q.questionSeverity === "easy" ? "bg-green-100 text-green-700" :
                      q.questionSeverity === "medium" ? "bg-yellow-100 text-yellow-700" :
                      "bg-red-100 text-red-700"
                    }`}
                  >
                    {q.questionSeverity}
                  </span>
                </div>

                <div className="space-y-2">
                  {opts.map((opt: string, i: number) => (
                    <label
                      key={i}
                      className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition ${
                        answers[q.quesId] === opt
                          ? "bg-teal-50 border-teal-600"
                          : "bg-white border-gray-300 hover:bg-gray-100"
                      }`}
                    >
                      <input
                        type="radio"
                        name={q.quesId}
                        value={opt}
                        checked={answers[q.quesId] === opt}
                        onChange={() => setAnswers({ ...answers, [q.quesId]: opt })}
                      />
                      <span className="text-gray-700">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* SUBMIT BUTTON */}
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
