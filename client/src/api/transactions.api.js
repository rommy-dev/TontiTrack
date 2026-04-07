import api from './axios.js';

export const transactionsApi = {
  getMine:      (params) => api.get('/transactions/me', { params }),
  getByGroup:   (groupId, params) =>
    api.get(`/transactions/group/${groupId}`, { params }),
  getById:      (id)     => api.get(`/transactions/${id}`),
};