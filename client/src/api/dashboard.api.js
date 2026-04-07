import api from './axios.js';

export const dashboardApi = {
  getKpis:           () => api.get('/dashboard/kpis'),
  getMonthly:        () => api.get('/dashboard/monthly'),
  getStatusBreakdown:() => api.get('/dashboard/status-breakdown'),
  getDebtByGroup:    () => api.get('/dashboard/debt-by-group'),
};