import api from './client';

export const listCurriculum = (courseId) => api.get(`/course/${courseId}/curriculum`).then((r) => r.data);

export const storeSection = (data) => api.post('/section', data).then((r) => r.data);
export const updateSection = (data) => api.post('/section/update', data).then((r) => r.data);
export const deleteSection = (id) => api.get(`/section/delete/${id}`).then((r) => r.data);
export const sortSections = (ids) => api.post('/section/sort', { itemJSON: ids }).then((r) => r.data);

const isFormData = (d) => typeof FormData !== 'undefined' && d instanceof FormData;
const lessonConfig = (d) => isFormData(d) ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined;

export const storeLesson = (data) => api.post('/lesson', data, lessonConfig(data)).then((r) => r.data);
export const updateLesson = (data) => api.post('/lesson/edit', data, lessonConfig(data)).then((r) => r.data);
export const getLesson = (id) => api.get(`/lesson/${id}`).then((r) => r.data);
export const deleteLesson = (id) => api.get(`/lesson/delete/${id}`).then((r) => r.data);
export const sortLessons = (ids) => api.post('/lesson/sort', { itemJSON: ids }).then((r) => r.data);
