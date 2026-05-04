import axios from "axios";

const BASE = (import.meta.env.VITE_ADMIN_API_URL as string) || "http://localhost:4000";

const api = axios.create({
  baseURL: `${BASE}/api/public`,
  timeout: 15000,
});

// Tag every request with the current student so server-side per-user keying works.
// Without this, every browser falls into the controller's default user_id=99 bucket
// and progress gets shared across students.
api.interceptors.request.use((config) => {
  const id = localStorage.getItem("userId");
  if (id) config.headers.set("x-user-id", String(id));
  return config;
});

export const listCourses = (params?: Record<string, unknown>) =>
  api.get("/courses", { params }).then((r) => r.data);

export const getCourseDetails = (slug: string) =>
  api.get(`/course/${slug}`).then((r) => r.data);

export const getPlayer = (slug: string, lessonId?: number | string) =>
  api.get(`/player/${slug}`, { params: { lesson_id: lessonId } }).then((r) => r.data);

export const completeLesson = (courseId: number, lessonId: number) =>
  api.post("/player/complete", { course_id: courseId, lesson_id: lessonId }).then((r) => r.data);

export type LessonProgressResult = {
  lesson_id: number;
  current_duration: number;
  watched_seconds: number;
  total_seconds: number;
  is_completed: 0 | 1;
};

export const updateLessonProgress = (
  courseId: number,
  lessonId: number,
  currentDuration: number,
) =>
  api
    .post("/player/progress", {
      course_id: courseId,
      lesson_id: lessonId,
      current_duration: currentDuration,
    })
    .then((r) => r.data as LessonProgressResult);

export type CourseProgressSummary = {
  user_id: number;
  max_progress: number;
  completed_any: boolean;
};

// Returns the user's highest course progress across all enrolled courses.
// Used by the Assessments tab to gate the Post-Assessment button.
export const getCourseProgressSummary = (userId?: number | string) =>
  api
    .get("/course-progress", { params: { user_id: userId } })
    .then((r) => r.data as CourseProgressSummary);

// ---- Certificate (student-side) ----

export type StudentCertificate = {
  id: number;
  user_id: number;
  course_id: number;
  identifier: string;
  issued_at?: string | null;
  created_at?: string;
};

// Returns the issued certificate for the current student + course pair, or
// null if the student hasn't completed the course yet. The x-user-id header
// is set by the request interceptor above.
export const findCourseCertificate = (courseId: number) =>
  api
    .get("/certificate/find", { params: { course_id: courseId } })
    .then((r) => r.data as { certificate: StudentCertificate | null });

// Idempotent: when progress < 100 the server rejects with a 400; when an
// (user_id, course_id) row already exists, returns it with created=false.
export const issueCourseCertificate = (courseId: number, progress = 100) =>
  api
    .post("/certificate/issue", { course_id: courseId, progress })
    .then((r) => r.data as { certificate: StudentCertificate; created: boolean });

// Returns every certificate the current student (x-user-id header) has earned,
// each with the joined course so the dashboard can show program title + date.
export type StudentCertificateWithCourse = StudentCertificate & {
  course?: { id: number; title?: string; slug?: string } | null;
};
export const listMyCertificates = () =>
  api
    .get("/certificate/mine")
    .then((r) => r.data as { certificates: StudentCertificateWithCourse[] });
