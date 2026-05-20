import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api';
import type { Notification } from '../types';
import { queryKeys } from '../queryKeys';

export type NotificationListParams = {
  is_read?: boolean;
  entity_type?: string;
  limit?: number;
};

export function useNotifications(params?: NotificationListParams) {
  return useQuery({
    queryKey: [...queryKeys.notifications.all, params ?? {}],
    queryFn: async () => {
      const search = new URLSearchParams();
      if (params?.is_read !== undefined) search.set('is_read', String(params.is_read));
      if (params?.entity_type) search.set('entity_type', params.entity_type);
      if (params?.limit) search.set('limit', String(params.limit));
      const qs = search.toString();
      return (await api.get<Notification[]>(`/notifications/${qs ? `?${qs}` : ''}`)).data;
    },
    refetchInterval: 60_000,
  });
}

export function useNotificationsInfinite(params?: Omit<NotificationListParams, 'limit'>) {
  const limit = 30;
  return useInfiniteQuery({
    queryKey: [...queryKeys.notifications.all, 'infinite', params ?? {}],
    queryFn: async ({ pageParam }) => {
      const search = new URLSearchParams({ limit: String(limit), skip: String(pageParam) });
      if (params?.is_read !== undefined) search.set('is_read', String(params.is_read));
      if (params?.entity_type) search.set('entity_type', params.entity_type);
      return (await api.get<Notification[]>(`/notifications/?${search}`)).data;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, _pages, lastPageParam) =>
      lastPage.length < limit ? undefined : lastPageParam + limit,
  });
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: queryKeys.notifications.unread,
    queryFn: async () => (await api.get<{ count: number }>('/notifications/unread-count')).data.count,
    refetchInterval: 60_000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unread });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => api.patch('/notifications/read-all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unread });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats });
    },
  });
}
