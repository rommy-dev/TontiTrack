import { useMutation } from '@tanstack/react-query';
import { useNavigate }           from 'react-router-dom';
import toast                     from 'react-hot-toast';
import { authApi }               from '../api/auth.api.js';
import { useAuthStore }          from '../store/authStore.js';
import { useQueryClient }        from '@tanstack/react-query';
import { groupKeys }             from './useGroups.js';
import { contributionKeys }       from './useContributions.js';
import { cycleKeys }             from './useCycles.js';
import { dashboardKeys }         from './useDashboard.js';
import { txKeys }                from './useTransactions.js';
import { groupsApi }             from '../api/groups.api.js';
import { dashboardApi }          from '../api/dashboard.api.js';
import { transactionsApi }       from '../api/transactions.api.js';

export function useLogin() {
  const setAuth   = useAuthStore((s) => s.setAuth);
  const navigate  = useNavigate();
  const qc        = useQueryClient();

  return useMutation({
    mutationFn: (credentials) => authApi.login(credentials),
    onSuccess: ({ data }) => {
      setAuth({ user: data.data.user, accessToken: data.data.accessToken });

      qc.prefetchQuery({
        queryKey: ['user', 'me'],
        queryFn: () => authApi.getMe().then(r => r.data.data.user),
        staleTime: 5 * 60 * 1000, // 5 min
      });

      qc.prefetchQuery({
        queryKey: groupKeys.all,
        queryFn: () => groupsApi.getAll().then(r => r.data.data.groups),
      });

      qc.prefetchQuery({
        queryKey: dashboardKeys.kpis,
        queryFn: () => dashboardApi.getKpis().then((r) => r.data.data),
      });
      qc.prefetchQuery({
        queryKey: dashboardKeys.monthly,
        queryFn: () => dashboardApi.getMonthly().then((r) => r.data.data),
      });
      qc.prefetchQuery({
        queryKey: dashboardKeys.breakdown,
        queryFn: () => dashboardApi.getStatusBreakdown().then((r) => r.data.data),
      });
      qc.prefetchQuery({
        queryKey: dashboardKeys.debt,
        queryFn: () => dashboardApi.getDebtByGroup().then((r) => r.data.data),
      });

      qc.prefetchQuery({
        queryKey: txKeys.mine({ page: 1, limit: 10 }),
        queryFn: () => transactionsApi.getMine({ page: 1, limit: 10 }).then((r) => r.data.data),
      });

      qc.invalidateQueries({ queryKey: dashboardKeys.kpis });
      qc.invalidateQueries({ queryKey: dashboardKeys.monthly });
      qc.invalidateQueries({ queryKey: dashboardKeys.breakdown });
      qc.invalidateQueries({ queryKey: dashboardKeys.debt });
      qc.invalidateQueries({ queryKey: txKeys.mine() });
      qc.invalidateQueries({ queryKey: contributionKeys.all });
      qc.invalidateQueries({ queryKey: cycleKeys.all });
      qc.invalidateQueries({ queryKey: ['notifications'] });

      toast.success(`Bienvenue, ${data.data.user.firstName} !`);
      navigate('/dashboard');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Identifiants incorrects');
    },
  });
}

export function useRegister() {
  const setAuth   = useAuthStore((s) => s.setAuth);
  const navigate  = useNavigate();
  const qc        = useQueryClient();

  return useMutation({
    mutationFn: (data) => authApi.register(data),
    onSuccess: ({ data }) => {
      setAuth({ user: data.data.user, accessToken: data.data.accessToken });

      qc.invalidateQueries({ queryKey: groupKeys.all });
      qc.invalidateQueries({ queryKey: contributionKeys.all });
      qc.invalidateQueries({ queryKey: cycleKeys.all });

      toast.success('Compte créé avec succès !');
      navigate('/dashboard');
    },
    onError: (err) => {
      const msg = err.response?.data?.message || 'Erreur lors de l\'inscription';
      toast.error(msg);
    },
  });
}