import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { cyclesApi } from '../api/cycles.api.js';

export const cycleKeys = {
  all:     ['cycles'],
  group:   (groupId) => ['cycles', 'group', groupId],
  detail:  (groupId, cycleId) => ['cycles', 'group', groupId, cycleId],
};

export function useGroupCycles(groupId) {
  return useQuery({
    queryKey: cycleKeys.group(groupId),
    queryFn:  () => cyclesApi.getGroupCycles(groupId).then((r) => r.data.data.cycles),
    enabled:  !!groupId,
  });
}

export function useCycle(groupId, cycleId) {
  return useQuery({
    queryKey: cycleKeys.detail(groupId, cycleId),
    queryFn:  () => cyclesApi.getCycle(groupId, cycleId).then((r) => r.data.data),
    enabled:  !!groupId && !!cycleId,
  });
}

export function useCreateCycle(groupId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => cyclesApi.createCycle(groupId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cycleKeys.group(groupId) });
      toast.success('Cycle créé !');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Erreur création cycle'),
  });
}