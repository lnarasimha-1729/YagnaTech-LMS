import StudentDashboard from "./StudentDashboard";
import ProgramsGrid from "@/components/programs/ProgramsGrid";

const CoursePrograms = () => (
  <StudentDashboard
    contentOverride={{
      title: "Programs",
      node: <ProgramsGrid />,
    }}
  />
);

export default CoursePrograms;
