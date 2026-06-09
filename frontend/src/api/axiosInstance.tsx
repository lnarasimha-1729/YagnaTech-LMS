import axios from 'axios';

// Empty / unset → use a RELATIVE base ("/api/v1") so calls inherit the page's
// scheme + host (e.g. https://yagnatech.org). This avoids mixed-content errors
// when the site is served over HTTPS but an absolute http:// IP was baked in.
// Only an explicit absolute value (http(s)://…) is used as-is; "localhost"
// stays the dev default when nothing is configured AND we're on localhost.
const RAW_BASTION = (import.meta.env.VITE_BASTION_API_URL ?? '').trim();
const BASTION_BASE: string =
  RAW_BASTION ||
  (typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:8000'
    : ''); // relative on any deployed host

const axiosInstance = axios.create({
  baseURL: `${BASTION_BASE}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // This is crucial for cookies to work
});

// Attach Authorization header if accessToken exists
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Endpoints that AuthProvider/Pages probe speculatively to detect login state.
// A 401 on these is the *expected* "not logged in" signal — it must NOT trigger
// a redirect, otherwise the page reload re-mounts AuthProvider, which re-probes,
// which 401s again, which reloads… an infinite loop visible as repeated
// "GET /api/v1/auth/profile 401" entries in the Bastion proxy log.
const SILENT_AUTH_PATHS = ['/auth/profile'];

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url: string = error.config?.url || '';
      const isSilent = SILENT_AUTH_PATHS.some((p) => url.includes(p));
      const onLoginPage =
        typeof window !== 'undefined' && window.location.pathname === '/login';

      // Skip the hard redirect for: (a) the silent auth probe and (b) when
      // we're already on /login. Both cases were causing reload loops.
      if (!isSilent && !onLoginPage && typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
