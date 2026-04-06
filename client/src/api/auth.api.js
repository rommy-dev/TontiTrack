import api from './axios.js';

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login:    (data) => api.post('/auth/login', data),
  logout:   ()     => api.post('/auth/logout'),
  refresh:  ()     => api.post('/auth/refresh'),
  getMe:    ()     => api.get('/users/me'),
  updateMe: (data) => api.patch('/users/me', data),
  updatePassword: (data) => api.patch('/users/me/password', data),
};