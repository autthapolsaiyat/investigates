import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://investigates-api.azurewebsites.net/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

export const authApi = {
  login: (username: string, password: string) => api.post('/auth/login', { username, password }),
  me: () => api.get('/users/me'),
};

export const casesApi = {
  list: () => api.get('/cases'),
  get: (id: number) => api.get(`/cases/${id}`),
};

export const adminApi = {
  getStats: () => api.get('/admin/stats'),
};
