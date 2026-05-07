import api from './client';

export const listCoupons = (params) => api.get('/coupons', { params }).then((r) => r.data);

export const getCoupon = (id) => api.get(`/coupon/edit/${id}`).then((r) => r.data);

export const storeCoupon = (body) => api.post('/coupon/store', body).then((r) => r.data);

export const updateCoupon = (id, body) => api.post(`/coupon/update/${id}`, body).then((r) => r.data);

export const deleteCoupon = (id) => api.delete(`/coupon/delete/${id}`).then((r) => r.data);

export const toggleCouponStatus = (id) => api.get(`/coupon/status/${id}`).then((r) => r.data);
