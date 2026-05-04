import axios from 'axios';

// admin-service direct (port 4000). Used for both API calls and static asset
// URLs (uploaded images served by express.static).
const BASE = import.meta.env.VITE_ADMIN_API_URL || 'http://localhost:4000';
export const API_BASE = BASE;
const TOKEN_KEY = 'admin_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

const api = axios.create({
    baseURL: `${BASE}/api/admin`,
    timeout: 30000,
});

api.interceptors.request.use((config) => {
    const token = getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// /auth/me is called speculatively during app hydration to detect whether
// an admin token is still valid. A 401 there is expected when the token has
// expired or was never set — it must NOT trigger a hard redirect, because
// AuthProvider/ProtectedRoute will already route the user to /login via
// React Router. Hard-redirecting on top of that caused the whole-app blink.
const SILENT_AUTH_PATHS = ['/auth/me'];

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error?.response?.status;
        const url = error?.config?.url || '';
        if (status === 401 || status === 403) {
            const isSilent = SILENT_AUTH_PATHS.some((p) => url.includes(p));
            if (isSilent) {
                clearToken();
                return Promise.reject(error);
            }
            console.warn(`[admin api] ${status} on ${url} — clearing token and redirecting to /login`);
            clearToken();
            if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        } else if (error?.message) {
            console.error(`[admin api] error on ${url}:`, error.message);
        }
        return Promise.reject(error);
    }
);

export default api;
