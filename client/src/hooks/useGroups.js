import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { groupsApi } from '../api/groups.api.js';

export const groupKeys = {
  all:    ['groups'],
  detail: (id) => ['groups', id],
  cycles: (id) => ['groups', id, 'cycles'],
};

export function useGroups() {
  return useQuery({
    queryKey: groupKeys.all,
    queryFn:  () => groupsApi.getAll().then((r) => r.data.data.groups),
  });
}

export function useGroup(id) {
  return useQuery({
    queryKey: groupKeys.detail(id),
    queryFn:  () => groupsApi.getById(id).then((r) => r.data.data.group),
    enabled:  !!id,
  });
}

export function useCreateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => groupsApi.create(data),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: groupKeys.all });
      toast.success('Groupe créé !');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Erreur création'),
  });
}

export function useAddMember(groupId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => groupsApi.addMember(groupId, data),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: groupKeys.detail(groupId) });
      toast.success('Membre ajouté !');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Erreur'),
  });
}

export function useActivateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (groupId) => groupsApi.activate(groupId),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: groupKeys.all });
      qc.invalidateQueries({ queryKey: groupKeys.detail() }); // invalidate all details
      toast.success('Groupe activé !');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Erreur activation'),
  });
}

export function useGroupCycles(groupId) {
  return useQuery({
    queryKey: groupKeys.cycles(groupId),
    queryFn:  () => groupsApi.getCycles(groupId).then((r) => r.data.data.cycles),
    enabled:  !!groupId,
  });
}
