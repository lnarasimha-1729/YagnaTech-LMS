import api from './client';

/**
 * College Dashboard — fetches the 5 KPI counts for the logged-in college
 * admin's college. The backend reads the college_id from the JWT, so the
 * frontend doesn't need to pass anything explicitly.
 */
export const getCollegeStats = () =>
    api.get('/college-dashboard/stats').then((r) => r.data);
