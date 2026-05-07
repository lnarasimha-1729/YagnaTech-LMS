import api from './client';

export const listInstructors = () => api.get('/instructors').then((r) => r.data);

export const listLiveClasses = (courseId) => api.get(`/course/${courseId}/live-classes`).then((r) => r.data);
export const storeLiveClass = (courseId, data) => api.post(`/course/${courseId}/live-class`, data).then((r) => r.data);
export const updateLiveClass = (id, data) => api.post(`/live-class/${id}`, data).then((r) => r.data);
export const deleteLiveClass = (id) => api.delete(`/live-class/${id}`).then((r) => r.data);
export const startLiveClass = (id) => api.get(`/live-class/${id}/start`).then((r) => r.data);
