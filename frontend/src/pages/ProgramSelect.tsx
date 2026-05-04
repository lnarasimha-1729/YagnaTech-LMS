import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ProgramCard from "@/components/programs/ProgramCard";
import { programs } from "@/components/programs/programsData";
import { listCourses } from "@/api/course/courseApi";
import { selectProgram } from "@/api/userProgressApi";

interface CourseSummary {
  id: number;
  slug: string;
  title: string;
}

const ProgramSelect = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  // Track which card is mid-click so only that card's CTA shows "Enrolling…",
  // not all three.
  const [busyIndex, setBusyIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Pull the catalog once. Each program card maps to a course by index;
  // index 0 → first course, etc. Falls back to the first course if a slot is missing.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await listCourses();
        if (cancelled) return;
        const list = Array.isArray(res?.data) ? res.data : [];
        setCourses(list.map((c: any) => ({ id: Number(c.id), slug: String(c.slug), title: String(c.title) })));
      } catch {
        if (!cancelled) setCourses([]);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Click a program card → record the selection, then land on the course details page.
  // Same destination the original ProgramsGrid uses, so this matches the prior flow.
  const handleView = async (programIndex: number) => {
    if (busyIndex !== null) return;
    setError(null);
    const course = courses[programIndex] || courses[0];
    if (!course) {
      setError("No courses available yet.");
      return;
    }
    const programKey = programIndex + 1;
    setBusyIndex(programIndex);
    try {
      try { await selectProgram(programKey, course.id); } catch { /* non-fatal */ }
      // Pass program_id along so the next page knows which program to enroll
      // the user into when they hit Enroll Now.
      navigate(
        `/courses/programs/course-details?slug=${encodeURIComponent(course.slug)}&program_id=${programKey}`,
      );
    } finally {
      setBusyIndex(null);
    }
  };

  return (
    <section className="section-padding bg-gradient-subtle">
      <div className="container-ngo max-w-6xl mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold mb-2 text-gray-800 text-center">Choose your program</h2>
        <p className="text-gray-600 mb-10 text-center">
          Pick the track that matches where you want to go next. You can revisit your dashboard anytime.
        </p>

        {error && <p className="text-red-600 mb-4 text-center">{error}</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {programs.map((program, i) => (
            <ProgramCard
              key={program.id}
              program={program}
              ctaLabel={busyIndex === i ? "Enrolling…" : "Start"}
              onView={() => handleView(i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProgramSelect;
