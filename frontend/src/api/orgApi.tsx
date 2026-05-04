import axiosInstance from './axiosInstance';

export const addOrg = (orgData) => {
  return axiosInstance.post('/organisation/add', orgData);
};

export const getOrg = (orgId) => {
  return axiosInstance.get(`/organisation/${orgId}`);
};

export const getAllOrgs = () => {
  return axiosInstance.get('/organisation/all');
};

export const updateOrg = (orgId, orgData) => {
  return axiosInstance.put(`/organisation/update/${orgId}`, orgData);
};

export const deleteOrg = (orgId) => {
  return axiosInstance.delete(`/organisation/delete/${orgId}`);
};