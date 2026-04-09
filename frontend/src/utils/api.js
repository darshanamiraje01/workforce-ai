import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Attach token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, err => Promise.reject(err));

// Handle 401 globally
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

// Typed API helpers
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/update-profile', data),
  updatePassword: (data) => api.put('/auth/update-password', data),
};

export const employeeAPI = {
  getAll: (params) => api.get('/employees', { params }),
  getOne: (id) => api.get(`/employees/${id}`),
  update: (id, data) => api.put(`/employees/${id}`, data),
  delete: (id) => api.delete(`/employees/${id}`),
  getStats: (id) => api.get(`/employees/${id}/stats`),
};

export const taskAPI = {
  getAll: (params) => api.get('/tasks', { params }),
  getOne: (id) => api.get(`/tasks/${id}`),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
  addComment: (id, data) => api.post(`/tasks/${id}/comments`, data),
};

export const attendanceAPI = {
  getAll: (params) => api.get('/attendance', { params }),
  mark: (data) => api.post('/attendance', data),
};

export const leaveAPI = {
  getAll: (params) => api.get('/leaves', { params }),
  request: (data) => api.post('/leaves', data),
  review: (id, data) => api.put(`/leaves/${id}/review`, data),
};

export const notificationAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/mark-all-read'),
  delete: (id) => api.delete(`/notifications/${id}`),
};

export const analyticsAPI = {
  getOverview: () => api.get('/analytics/overview'),
  getAttendanceTrends: (params) => api.get('/analytics/attendance-trends', { params }),
};

export const aiAPI = {
  getProductivityScore: (id, days) => api.get(id ? `/ai/productivity/${id}` : '/ai/productivity', { params: { days } }),
  getAtRiskTasks: () => api.get('/ai/at-risk-tasks'),
  getWorkloadBalance: () => api.get('/ai/workload-balance'),
  getPerformanceSummary: (id, period) => api.get(id ? `/ai/performance-summary/${id}` : '/ai/performance-summary', { params: { period } }),
  getTeamInsights: () => api.get('/ai/team-insights'),
};

export const documentAPI = {
  getAll: (params) => api.get('/documents', { params }),
  upload: (data) => api.post('/documents', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => api.delete(`/documents/${id}`),
};
