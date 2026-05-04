import api from './client';

export const getSettings = () => api.get('/admin/certificate/settings').then((r) => r.data);

export const uploadTemplate = (file) => {
    const fd = new FormData();
    fd.append('certificate_template', file);
    // Don't set Content-Type manually — axios auto-fills it with the correct
    // multipart boundary, which multer needs to parse the body.
    return api.post('/admin/certificate/template', fd).then((r) => r.data);
};

export const updateBuilder = (html) =>
    api.post('/admin/certificate/builder', { certificate_builder_content: html }).then((r) => r.data);

export const listCertificates = () => api.get('/certificates').then((r) => r.data);

export const issueCertificate = (user_id, course_id, progress = 100) =>
    api.post('/certificates/issue', { user_id, course_id, progress }).then((r) => r.data);

export const deleteCertificate = (id) => api.delete(`/certificates/${id}`).then((r) => r.data);

export const renderCertificate = (identifier) => api.get(`/certificate/${identifier}`).then((r) => r.data);
