import { useQuery } from '@tanstack/react-query';
import { groupsApi } from '../api/groups.api.js';

export const contributionKeys = {
  summary: (groupId) => ['contributions', 'group', groupId, 'summary'],
};

export function useGroupDebtSummary(groupId) {
  return useQuery({
    queryKey: contributionKeys.summary(groupId),
    queryFn:  () => groupsApi.getDebtSummary(groupId).then((r) => r.data.data),
    enabled:  !!groupId,
  });
}