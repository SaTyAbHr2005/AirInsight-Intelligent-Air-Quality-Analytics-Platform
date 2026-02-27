import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const fetchLatestAQI = () => api.get('/latest');
export const fetchHistory = (regionId) => api.get(`/history/${regionId}`);
export const predictAQI = (data) => api.post('/predict', data);
export const fetchForecast = (sensorId) => api.get(`/forecast/${sensorId}`);
export const fetchTopPolluted = () => api.get('/top-polluted');

export const registerAdmin = (username, email, password) =>
    api.post(`/admin/register?username=${encodeURIComponent(username)}&email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`);

export const loginAdmin = (username, password) => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);
    return api.post('/admin/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
};

export const fetchSensors = () => api.get('/admin/sensors');
export const updateSensorStatus = (id, isActive) => api.put(`/admin/sensor/${id}/status?is_active=${isActive}`);

export default api;
