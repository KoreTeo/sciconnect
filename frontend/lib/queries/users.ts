import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api';
import type { NotificationPreferences } from '../types';
import type { PasswordFormValues, ProfileFormValues } from '../validation';

export const notificationPrefsKey = ['users', 'notification-preferences'] as const;

export function useNotificationPreferences() {
  return useQuery({
    queryKey: notificationPrefsKey,
    queryFn: async () =>
      (await api.get<NotificationPreferences>('/users/me/notification-preferences')).data,
  });
}

export function useUpdateProfile() {
  return useMutation({
    mutationFn: async (values: ProfileFormValues) => {
      const payload = {
        ...values,
        country: values.country ? values.country.toUpperCase() : undefined,
      };
      return (await api.put('/users/me', payload)).data;
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: async (values: PasswordFormValues) => api.post('/users/me/password', values),
  });
}

export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (prefs: Partial<NotificationPreferences>) =>
      (await api.patch<NotificationPreferences>('/users/me/notification-preferences', prefs)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationPrefsKey }),
  });
}
