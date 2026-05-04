import api from './client';

export const listCourses = (params) => api.get('/courses', { params }).then((r) => r.data);

export const createMeta = () => api.get('/course/create').then((r) => r.data);
export const storeCourse = (fd) =>
    api.post('/course/store', fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data);
export const getCourse = (id) => api.get(`/course/edit/${id}`).then((r) => r.data);
export const updateCourse = (id, fd) =>
    api.post(`/course/update/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data);
export const duplicateCourse = (id) => api.get(`/course/duplicate/${id}`).then((r) => r.data);
export const setCourseStatus = (type, id) => api.get(`/course/status/${type}/${id}`).then((r) => r.data);
export const deleteCourse = (id) => api.delete(`/course/delete/${id}`).then((r) => r.data);
export const draftCourse = (id) => api.get(`/course/draft/${id}`).then((r) => r.data);
export const approveCourse = (id, body) => api.post(`/course/approval/${id}`, body).then((r) => r.data);
