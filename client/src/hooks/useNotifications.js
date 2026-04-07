import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../api/notifications.api.js';

export const notifKeys = {
  all:     (p) => ['notifications', p],
  unread:  ['notifications', 'unread-count'],
};

export function useNotifications(params = {}) {
  return useQuery({
    queryKey: notifKeys.all(params),
    queryFn:  () => notificationsApi.getAll(params).then((r) => r.data.data),
  });
}

// Polling toutes les 60s — maintient le badge à jour sans WebSocket
export function useUnreadCount() {
  return useQuery({
    queryKey:  notifKeys.unread,
    queryFn:   () => notificationsApi.getUnreadCount().then((r) => r.data.data.count),
    refetchInterval: 60_000,
  });
}

export function useMarkAsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllAsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: notificationsApi.markAllAsRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}