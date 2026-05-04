import api from './client';

export const listAdmins = (params) => api.get('/admins', { params }).then((r) => r.data);
export const getAdmin = (id) => api.get(`/admins/${id}`).then((r) => r.data);
export const createAdmin = (fd) => api.post('/admins', fd).then((r) => r.data);
export const updateAdmin = (id, fd) => api.post(`/admins/${id}`, fd).then((r) => r.data);
export const deleteAdmin = (id) => api.delete(`/admins/${id}`).then((r) => r.data);

export const dashboardStats = () => api.get('/dashboard').then((r) => r.data);
