import api from './client';

export const listCategories = () => api.get('/categories').then((r) => r.data);

export const storeCategory = (fd) =>
    api.post('/category/store', fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data);

export const updateCategory = (id, fd) =>
    api.post(`/category/update/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data);

export const deleteCategory = (id) => api.delete(`/category/delete/${id}`).then((r) => r.data);
