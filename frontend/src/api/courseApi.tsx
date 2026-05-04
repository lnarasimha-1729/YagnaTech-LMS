import axiosInstance from './axiosInstance';

// Course APIs
export const addCourse = (courseData) => {
  return axiosInstance.post('/course/add', courseData);
};

export const getCourse = (courseId) => {
  return axiosInstance.get(`/course/${courseId}`);
};

export const getAllCourses = () => {
  return axiosInstance.get('/course/all');
};

export const updateCourse = (courseId, courseData) => {
  return axiosInstance.put(`/course/update/${courseId}`, courseData);
};

export const deleteCourse = (courseId) => {
  return axiosInstance.delete(`/course/delete/${courseId}`);
};

// Enrollment APIs
export const enrollCourse = (enrollmentData) => {
  return axiosInstance.post('/course/enroll/', enrollmentData);
};

export const getMyCourses = () => {
  return axiosInstance.get('/course/enroll/my-courses');
};