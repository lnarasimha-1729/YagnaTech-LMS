import axios from 'axios';

export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5070';

const api = axios.create({
    baseURL: `${API_BASE}/api`,
    timeout: 10000,
});

export default api;
