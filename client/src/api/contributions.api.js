import api from './axios.js';

export const contributionsApi = {
  getMine:      (params) => api.get('/contributions/me', { params }),
  getById:      (id)     => api.get(`/contributions/${id}`),
  pay:          (id, data) => api.post(`/contributions/${id}/pay`, data),
  getGroupSummary: (groupId) =>
    api.get(`/contributions/group/${groupId}/summary`),
};