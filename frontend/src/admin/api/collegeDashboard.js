import api from './client';

/**
 * College Dashboard — fetches the 5 KPI counts for the logged-in college
 * admin's college. The backend reads the college_id from the JWT, so the
 * frontend doesn't need to pass anything explicitly.
 */
export const getCollegeStats = () =>
    api.get('/college-dashboard/stats').then((r) => r.data);

// Courses the root admin assigned to this college (read-only). College is read
// from the JWT server-side. Returns { courses: [{ id, title, status,
// lesson_count, enrolled }] }.
export const getCollegeCourses = () =>
    api.get('/college-dashboard/courses').then((r) => r.data);

// Programs the root admin assigned to this college (read-only). Returns
// { programs: [{ id, title, status, courses[], batches[], enrolled }] }.
export const getCollegePrograms = () =>
    api.get('/college-dashboard/programs').then((r) => r.data);

// Pending student signup requests for this college, and approve one.
export const getStudentRequests = () =>
    api.get('/college-dashboard/student-requests').then((r) => r.data);

export const approveStudentRequest = (userId) =>
    api.post(`/college-dashboard/student-requests/${userId}/approve`).then((r) => r.data);
