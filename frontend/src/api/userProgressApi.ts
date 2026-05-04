import axios from "axios";

const ADMIN_BASE = (import.meta.env.VITE_ADMIN_API_URL as string) || "http://localhost:4000";

const client = axios.create({ baseURL: `${ADMIN_BASE}/api`, timeout: 15000 });

export type ProgressTarget = {
  program_id: number;
  course_id: number;
  course_slug: string;
  last_lesson_id: number | null;
  enrolled: true;
  player_path: string;
};

export type UserProgressRow = {
  id: number;
  user_id: number;
  program_id: number;
  course_id: number | null;
  last_lesson_id: number | null;
  enrolled: boolean;
};

const userId = () => Number(localStorage.getItem("userId")) || 0;

class NoUserError extends Error {
  constructor() { super("user not signed in"); }
}

const requireUser = () => {
  const id = userId();
  if (!id) throw new NoUserError();
  return id;
};

export const getUserProgress = async () => {
  // Don't hit the server until we know who the user is — avoids the 422 noise
  // on first paint before AuthProvider has hydrated from cookie.
  const id = userId();
  if (!id) return { rows: [], target: null } as { rows: UserProgressRow[]; target: ProgressTarget | null };
  const r = await client.get("/user-progress", { params: { user_id: id } });
  return r.data as { rows: UserProgressRow[]; target: ProgressTarget | null };
};

export const selectProgram = (programId: number, courseId?: number) =>
  client
    .post("/user-progress/select-program", {
      user_id: requireUser(),
      program_id: programId,
      course_id: courseId ?? null,
    })
    .then((r) => r.data as { row: UserProgressRow; target: ProgressTarget | null });

export const enrollCourse = (programId: number, courseId: number) =>
  client
    .post("/user-progress/enroll-course", {
      user_id: requireUser(),
      program_id: programId,
      course_id: courseId,
    })
    .then((r) => r.data as { row: UserProgressRow; target: ProgressTarget });

export const updateLastLesson = (courseId: number, lessonId: number) =>
  client
    .patch("/user-progress/last-lesson", {
      user_id: requireUser(),
      course_id: courseId,
      lesson_id: lessonId,
    })
    .then((r) => r.data);
