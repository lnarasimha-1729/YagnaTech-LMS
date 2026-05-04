import axios from "axios";

const ADMIN_BASE = (import.meta.env.VITE_ADMIN_API_URL as string) || "http://localhost:4000";

const client = axios.create({
  baseURL: `${ADMIN_BASE}/api`,
  timeout: 15000,
});

// Reuse whichever JWT the rest of the app stores. We try a few common keys so this
// works regardless of which login flow the user came through.
const getToken = () =>
  localStorage.getItem("admin_token")
  || localStorage.getItem("accessToken")
  || localStorage.getItem("token")
  || "";

client.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export type PreAssessmentStatus = {
  program_id: number | null;
  passed: boolean;
  score: number | null;
  threshold: number;
};

export const submitPreAssessment = (score: number, programId?: number | null) =>
  client.post<PreAssessmentStatus>("/pre-assessment/submit", {
    score,
    program_id: programId ?? null,
  }).then((r) => r.data);

export const getPreAssessmentStatus = (programId: number | string) =>
  client.get<PreAssessmentStatus>(`/pre-assessment/status/${programId}`).then((r) => r.data);
