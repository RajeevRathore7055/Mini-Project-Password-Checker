


import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:8000' });

API.interceptors.request.use(config => {
  const token = localStorage.getItem('sp_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('sp_token');
      localStorage.removeItem('sp_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  register: (data) => API.post('/api/auth/register', data),
  login:    (data) => API.post('/api/auth/login',    data),
  me:       ()     => API.get('/api/auth/me'),
};

export const analyzeAPI = {
  analyze: (password)          => API.post('/api/analyze',      { password }),
  breach:  (password, scan_id) => API.post('/api/breach/check', { password, scan_id }),
};

export const historyAPI = {
  getHistory: (page = 1) => API.get(`/api/history?page=${page}&per_page=10`),
  deleteScan: (id)        => API.delete(`/api/history/${id}`),
};

export const adminAPI = {
  getStats:           ()          => API.get('/api/admin/stats'),
  getUsers:           (search='') => API.get(`/api/admin/users?search=${search}`),
  addUser:            (data)      => API.post('/api/admin/users/add', data),
  deleteUser:         (id)        => API.delete(`/api/admin/users/${id}`),
  banUser:            (id)        => API.put(`/api/admin/users/${id}/ban`),
  changeRole:         (id, role)  => API.put(`/api/admin/users/${id}/role`, { role }),
  getUserScans:       (id)        => API.get(`/api/admin/users/${id}/scans`),
  getSecurity:        ()          => API.get('/api/admin/security'),
  getBreachAlerts:    ()          => API.get('/api/admin/breach-alerts'),
  deleteBreachAlert:  (id)        => API.delete(`/api/admin/breach-alerts/${id}`),
  deleteAllAlerts:    ()          => API.delete('/api/admin/breach-alerts'),
};

export default API;
