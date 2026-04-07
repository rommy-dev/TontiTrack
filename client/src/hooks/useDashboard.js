import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api/dashboard.api.js';

const keys = {
  kpis:      ['dashboard', 'kpis'],
  monthly:   ['dashboard', 'monthly'],
  breakdown: ['dashboard', 'breakdown'],
  debt:      ['dashboard', 'debt'],
};

export function useDashboardKpis() {
  return useQuery({
    queryKey: keys.kpis,
    queryFn:  () => dashboardApi.getKpis().then((r) => r.data.data),
    staleTime: 1000 * 60,   // 1 minute — les KPIs changent peu souvent
  });
}

export function useMonthlyChart() {
  return useQuery({
    queryKey: keys.monthly,
    queryFn:  () => dashboardApi.getMonthly().then((r) => r.data.data),
    staleTime: 1000 * 60 * 5,
  });
}

export function useStatusBreakdown() {
  return useQuery({
    queryKey: keys.breakdown,
    queryFn:  () => dashboardApi.getStatusBreakdown().then((r) => r.data.data),
    staleTime: 1000 * 60 * 2,
  });
}

export function useDebtByGroup() {
  return useQuery({
    queryKey: keys.debt,
    queryFn:  () => dashboardApi.getDebtByGroup().then((r) => r.data.data),
    staleTime: 1000 * 60 * 2,
  });
}