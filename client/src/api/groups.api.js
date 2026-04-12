import api from './axios.js';

export const groupsApi = {
  getAll:       ()           => api.get('/groups'),
  getById:      (id)         => api.get(`/groups/${id}`),
  create:       (data)       => api.post('/groups', data),
  update:       (id, data)   => api.patch(`/groups/${id}`, data),
  transferAdmin:(id, data)   => api.patch(`/groups/${id}/admin`, data),
  updateStatus: (id, data)   => api.patch(`/groups/${id}/status`, data),
  addMember:    (id, data)   => api.post(`/groups/${id}/members`, data),
  removeMember: (id, uid)    => api.delete(`/groups/${id}/members/${uid}`),
  activate:     (id)         => api.patch(`/groups/${id}/activate`),

  // Cycles
  getCycles:    (groupId)    => api.get(`/groups/${groupId}/cycles`),
  createCycle:  (groupId, d) => api.post(`/groups/${groupId}/cycles`, d),
  getCycle:     (groupId, cycleId) =>
    api.get(`/groups/${groupId}/cycles/${cycleId}`),

  // Summary dettes
  getDebtSummary: (groupId) =>
    api.get(`/contributions/group/${groupId}/summary`),

  // Historique transactions
  getHistory: (groupId, params) =>
    api.get(`/transactions/group/${groupId}`, { params }),
};