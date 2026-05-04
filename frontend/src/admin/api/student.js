import api from './client';

export const listStudents = (params) => api.get('/students', { params }).then((r) => r.data);
export const getStudent = (id) => api.get(`/students/${id}`).then((r) => r.data);
export const createStudent = (fd) => api.post('/students', fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data);
export const updateStudent = (id, fd) => api.post(`/students/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data);
export const deleteStudent = (id) => api.delete(`/students/${id}`).then((r) => r.data);
