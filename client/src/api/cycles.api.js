import api from './axios.js';

export const cyclesApi = {
  // Récupérer tous les cycles d'un groupe
  getGroupCycles: (groupId) => api.get(`/groups/${groupId}/cycles`),

  // Créer un nouveau cycle pour un groupe
  createCycle: (groupId, data) => api.post(`/groups/${groupId}/cycles`, data),

  // Récupérer un cycle spécifique avec ses contributions
  getCycle: (groupId, cycleId) => api.get(`/groups/${groupId}/cycles/${cycleId}`),
};