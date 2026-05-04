import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
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
