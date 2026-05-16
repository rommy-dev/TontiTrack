import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api/dashboard.api.js';

export const dashboardKeys = {
  all:       ['dashboard'],
  kpis:      ['dashboard', 'kpis'],
  monthly:   ['dashboard', 'monthly'],
  breakdown: ['dashboard', 'breakdown'],
  debt:      ['dashboard', 'debt'],
};

export function refreshDashboardQueries(queryClient) {
  return queryClient.invalidateQueries({
    queryKey:    dashboardKeys.all,
    refetchType: 'all',
  });
}

export function useDashboardKpis() {
  return useQuery({
    queryKey: dashboardKeys.kpis,
    queryFn:  () => dashboardApi.getKpis().then((r) => r.data.data),
    staleTime: 1000 * 60,   // 1 minute — les KPIs changent peu souvent
  });
}

export function useMonthlyChart() {
  return useQuery({
    queryKey: dashboardKeys.monthly,
    queryFn:  () => dashboardApi.getMonthly().then((r) => r.data.data),
    staleTime: 1000 * 60 * 5,
  });
}

export function useStatusBreakdown() {
  return useQuery({
    queryKey: dashboardKeys.breakdown,
    queryFn:  () => dashboardApi.getStatusBreakdown().then((r) => r.data.data),
    staleTime: 1000 * 60 * 2,
  });
}

export function useDebtByGroup() {
  return useQuery({
    queryKey: dashboardKeys.debt,
    queryFn:  () => dashboardApi.getDebtByGroup().then((r) => r.data.data),
    staleTime: 1000 * 60 * 2,
  });
}
