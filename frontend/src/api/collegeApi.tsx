import axiosInstance from './axiosInstance';

// College APIs
export const addCollege = (collegeData) => {
  return axiosInstance.post('/college/add', collegeData);
};

export const getCollege = (collegeId) => {
  return axiosInstance.get(`/college/${collegeId}`);
};

export const getAllColleges = () => {
  return axiosInstance.get('/college/all');
};

export const updateCollege = (collegeId, collegeData) => {
  return axiosInstance.put(`/college/update/${collegeId}`, collegeData);
};

export const deleteCollege = (collegeId) => {
  return axiosInstance.delete(`/college/delete/${collegeId}`);
};

// Branch APIs
export const addBranch = (branchData) => {
  return axiosInstance.post('/college/branch/add', branchData);
};

export const getAllBranches = () => {
  return axiosInstance.get('/college/branch/all');
};

export const updateBranch = (branchId, branchData) => {
  return axiosInstance.put(`/college/branch/update/${branchId}`, branchData);
};

export const deleteBranch = (branchId) => {
  return axiosInstance.delete(`/college/branch/delete/${branchId}`);
};

export const assignBranchToCollege = (assignmentData) => {
  return axiosInstance.post('/college/branch/assign', assignmentData);
};