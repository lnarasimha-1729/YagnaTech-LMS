import axios from "axios";

const ADMIN_BASE =
  (import.meta.env.VITE_ADMIN_API_URL as string) || "http://localhost:4000";

export interface ContactPayload {
  firstName: string;
  lastName?: string;
  email: string;
  subject?: string;
  message: string;
}

// Submit the public contact form. Resolves on 201; rejects (with the server's
// 422/500 error) otherwise.
export const sendContactMessage = (payload: ContactPayload) =>
  axios
    .post(`${ADMIN_BASE}/api/public/contact`, payload, { timeout: 20000 })
    .then((r) => r.data as { ok: true; id: number });
