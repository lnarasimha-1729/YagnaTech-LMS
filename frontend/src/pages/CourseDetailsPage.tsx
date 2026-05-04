import StudentDashboard from "./StudentDashboard";
import CourseDetails from "./CourseDetails";

const CourseDetailsPage = () => (
  <StudentDashboard
    contentOverride={{
      title: "Course Details",
      node: <CourseDetails />,
    }}
  />
);

export default CourseDetailsPage;
