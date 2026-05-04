import api, { setToken, clearToken } from './client';

export const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    if (data?.token) setToken(data.token);
    if (data?.user) localStorage.setItem('admin_user', JSON.stringify(data.user));
    return data;
};

export const me = () => api.get('/auth/me').then((r) => r.data);

export const logout = async () => {
    try { await api.post('/auth/logout'); } catch (_e) { /* ignore */ }
    clearToken();
    localStorage.removeItem('admin_user');
};

export const getStoredUser = () => {
    try {
        const raw = localStorage.getItem('admin_user');
        return raw ? JSON.parse(raw) : null;
    } catch (_e) {
        return null;
    }
};
