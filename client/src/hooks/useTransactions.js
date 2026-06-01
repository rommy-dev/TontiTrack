import { useQuery } from '@tanstack/react-query';
import { transactionsApi } from '../api/transactions.api.js';

export const txKeys = {
  all:     ['transactions'],
  mine:    (p) => ['transactions', 'me', p],
  group:   (id, p) => ['transactions', 'group', id, p],
};

export function useMyTransactions(params = {}) {
  return useQuery({
    queryKey: txKeys.mine(params),
    queryFn:  () => transactionsApi.getMine(params).then((r) => r.data.data),
  });
}

export function useGroupTransactions(groupId, params = {}) {
  return useQuery({
    queryKey: txKeys.group(groupId, params),
    queryFn:  () => transactionsApi.getByGroup(groupId, params)
      .then((r) => r.data.data),
    enabled:  !!groupId,
  });
}
