import api, { setToken, clearToken } from './client';

export const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    if (data?.token) setToken(data.token);
    if (data?.user) localStorage.setItem('admin_user', JSON.stringify(data.user));
    return data;
};

export const me = () => api.get('/auth/me').then((r) => r.data);

// Change the signed-in user's password (admin / college admin / instructor).
export const changePassword = (payload) =>
    api.post('/auth/change-password', payload).then((r) => r.data);

// Update the signed-in user's profile. `payload` is a plain object of text
// fields; pass a File as `photo` to also upload a new avatar. Sent as
// multipart/form-data so the same upload.single('photo') parser handles it.
export const updateProfile = (payload = {}, photo = null) => {
    const fd = new FormData();
    Object.entries(payload).forEach(([k, v]) => {
        if (v !== undefined && v !== null) fd.append(k, v);
    });
    if (photo) fd.append('photo', photo);
    return api
        .post('/auth/update-profile', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        .then((r) => r.data);
};

// Merge fields into the cached admin_user so the UI (name/email shown in the
// navbar/profile) reflects an edit without a full re-login.
export const patchStoredUser = (patch) => {
    try {
        const raw = localStorage.getItem('admin_user');
        const cur = raw ? JSON.parse(raw) : {};
        localStorage.setItem('admin_user', JSON.stringify({ ...cur, ...patch }));
    } catch (_e) { /* ignore */ }
};

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
