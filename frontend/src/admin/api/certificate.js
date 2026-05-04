import api, { API_BASE } from './client';

// ---- Coupon-style table CRUD ----
export const listCertificates = (params) => api.get('/certificates', { params }).then((r) => r.data);

export const getCertificate = (id) => api.get(`/certificate/edit/${id}`).then((r) => r.data);

export const storeCertificate = (body) =>
    api.post('/certificate/store', body, {
        headers: body instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
    }).then((r) => r.data);

export const updateCertificate = (id, body) =>
    api.post(`/certificate/update/${id}`, body, {
        headers: body instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
    }).then((r) => r.data);

export const deleteCertificate = (id) => api.delete(`/certificate/delete/${id}`).then((r) => r.data);

export const toggleCertificateStatus = (id) => api.get(`/certificate/status/${id}`).then((r) => r.data);

// ---- Certificate-module: settings + builder ----
export const getCertificateSettings = () => api.get('/certificate/settings').then((r) => r.data);

export const uploadCertificateTemplate = (file) => {
    const fd = new FormData();
    fd.append('certificate_template', file);
    // Don't set Content-Type manually — axios picks the multipart boundary multer needs.
    return api.post('/certificate/template', fd).then((r) => r.data);
};

export const updateCertificateBuilder = (html) =>
    api.post('/certificate/builder', { certificate_builder_content: html }).then((r) => r.data);

// ---- Certificate-module: issue / render ----
export const issueCertificate = (user_id, course_id, progress = 100) =>
    api.post('/certificate/issue', { user_id, course_id, progress }).then((r) => r.data);

// Public render — uses an unauthenticated axios call so a logged-out student
// can hit /certificate/:identifier directly. Hits /api/public/certificate/:id.
export const renderCertificate = async (identifier) => {
    const res = await fetch(`${API_BASE}/api/public/certificate/${encodeURIComponent(identifier)}`);
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const e = new Error(err.error || 'Certificate not found');
        e.response = { data: err, status: res.status };
        throw e;
    }
    return res.json();
};
