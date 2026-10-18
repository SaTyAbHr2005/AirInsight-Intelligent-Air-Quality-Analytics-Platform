import axios from 'axios';
import { useQuery } from '@tanstack/react-query';

// Vercel/Render: set VITE_API_URL to the backend origin. Docker/dev: '/api' is proxied.
export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token && !config.headers.Authorization) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

const get = (url, params) => api.get(url, { params }).then((r) => r.data);
const LIVE = { refetchInterval: 60_000 };

export const useLatest = () => useQuery({ queryKey: ['latest'], queryFn: () => get('/latest'), ...LIVE });
export const useRegions = () => useQuery({ queryKey: ['regions'], queryFn: () => get('/regions'), ...LIVE });
export const usePublicSensors = () => useQuery({ queryKey: ['sensors'], queryFn: () => get('/public/sensors'), ...LIVE });
export const useHistory = (regionId, hours = 48) =>
    useQuery({ queryKey: ['history', regionId, hours], queryFn: () => get(`/history/${regionId}`, { hours }), enabled: !!regionId, ...LIVE });
export const useForecast = (sensorId, hours = 6) =>
    useQuery({ queryKey: ['forecast', sensorId, hours], queryFn: () => get(`/forecast/${sensorId}`, { hours }), enabled: !!sensorId, ...LIVE });

export const predictAQI = (data, persist = false) => api.post('/predict', data, { params: { persist } }).then((r) => r.data);

export const registerAdmin = (username, email, password) => api.post('/admin/register', { username, email, password });
export const loginAdmin = (username, password) =>
    api.post('/admin/login', new URLSearchParams({ username, password }), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

export const fetchSensors = () => get('/admin/sensors');
export const updateSensorStatus = (id, isActive) => api.put(`/admin/sensor/${id}/status`, null, { params: { is_active: isActive } });
export const deleteSensor = (id) => api.delete(`/admin/sensor/${id}`);
export const createSensor = (data) => api.post('/admin/sensor', data);

export const errorText = (e, fallback) => {
    const d = e?.response?.data?.detail;
    if (Array.isArray(d)) return d.map((x) => x.msg).join('; ');
    return d || (e?.response ? fallback : 'Cannot reach the AirInsight server. Check that the backend is running.');
};
