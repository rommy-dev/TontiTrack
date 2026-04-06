// src/hooks/useContributions.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { contributionsApi } from '../api/contributions.api.js';

export const contributionKeys = {
  all:     ['contributions'],
  mine:    (params) => ['contributions', 'me', params],
  detail:  (id) => ['contributions', id],
  summary: (groupId) => ['contributions', 'group', groupId, 'summary'],
};

export function useMyContributions(params = {}) {
  return useQuery({
    queryKey: contributionKeys.mine(params),
    queryFn:  () => contributionsApi.getMine(params)
      .then((r) => r.data.data),
  });
}

export function useGroupDebtSummary(groupId) {
  return useQuery({
    queryKey: contributionKeys.summary(groupId),
    queryFn:  () => contributionsApi.getGroupSummary(groupId).then((r) => r.data.data.summary),
    enabled:  !!groupId,
  });
}

export function usePayContribution(contributionId) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (amount) => contributionsApi.pay(contributionId, { amount }),

    onSuccess: (res) => {
      const { newStatus } = res.data.data;

      // Invalider toutes les queries liées — cycle, contributions, summary
      qc.invalidateQueries({ queryKey: ['groups'] });
      qc.invalidateQueries({ queryKey: contributionKeys.all });

      const messages = {
        paid:    'Paiement complet enregistré !',
        partial: 'Paiement partiel enregistré.',
        late:    'Paiement enregistré (en retard).',
      };
      toast.success(messages[newStatus] ?? 'Paiement enregistré');
    },

    onError: (err) => {
      toast.error(err.response?.data?.message || 'Erreur lors du paiement');
    },
  });
}