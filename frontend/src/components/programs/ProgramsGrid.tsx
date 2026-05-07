import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ProgramCard from "./ProgramCard";
import { programs } from "./programsData";
import { listCourses } from "@/api/course/courseApi";

interface CourseSummary {
  id: number | string;
  slug: string;
  title: string;
}

interface ProgramsGridProps {
  onView?: (id: string | number) => void;
}

const ProgramsGrid = ({ onView }: ProgramsGridProps) => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<CourseSummary[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await listCourses();
        if (cancelled) return;
        const list = Array.isArray(res?.data) ? res.data : [];
        setCourses(list.map((c: CourseSummary) => ({ id: c.id, slug: c.slug, title: c.title })));
      } catch {
        if (!cancelled) setCourses([]);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleView = (programIndex: number) => {
    const slug = courses[programIndex]?.slug || courses[0]?.slug || "first";
    if (onView) return onView(slug);
    navigate(`/courses/programs/course-details?slug=${encodeURIComponent(slug)}`);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {programs.map((program, i) => (
        <ProgramCard
          key={program.id}
          program={program}
          onView={() => handleView(i)}
        />
      ))}
    </div>
  );
};

export default ProgramsGrid;
