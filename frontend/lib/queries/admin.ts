import { keepPreviousData, useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import api from '../api';
import type { AdminAuditLog, AdminSummary, Conference, User } from '../types';
import { queryKeys } from '../queryKeys';

export interface AdminUsersFilters {
  q?: string;
  role?: string;
  is_active?: boolean;
  skip?: number;
  limit?: number;
}

export interface AdminConferencesFilters {
  q?: string;
  status?: string;
  skip?: number;
  limit?: number;
}

export interface AdminAuditLogFilters {
  entity_type?: string;
  actor_id?: number;
  skip?: number;
  limit?: number;
}

export interface ConferenceModerationPayload {
  action: 'approve' | 'request_changes' | 'reject';
  comment?: string;
}

export function invalidateAdminAudit(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ['admin', 'audit-log'] });
}

export function invalidateAdminConferences(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ['admin', 'conferences'] });
  queryClient.invalidateQueries({ queryKey: queryKeys.admin.summary });
}

export function useAdminUsers(filters: AdminUsersFilters, enabled = true) {
  return useQuery({
    queryKey: queryKeys.admin.users(filters),
    queryFn: async () => (await api.get<User[]>('/admin/users', { params: filters })).data,
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useAdminSummary() {
  return useQuery({
    queryKey: queryKeys.admin.summary,
    queryFn: async () => (await api.get<AdminSummary>('/admin/summary')).data,
  });
}

export function useAdminConferences(filters: AdminConferencesFilters = {}, enabled = true) {
  return useQuery({
    queryKey: queryKeys.admin.conferences(filters),
    queryFn: async () => (await api.get<Conference[]>('/admin/conferences', { params: filters })).data,
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useAdminAuditLog(filters: AdminAuditLogFilters = {}, enabled = true) {
  return useQuery({
    queryKey: queryKeys.admin.auditLog(filters),
    queryFn: async () => (await api.get<AdminAuditLog[]>('/admin/audit-log', { params: filters })).data,
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useUpdateAdminUser(filters: AdminUsersFilters) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: number; patch: Record<string, unknown> }) => api.patch(`/admin/users/${id}`, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users(filters) });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.summary });
      invalidateAdminAudit(queryClient);
    },
  });
}

export function useUpdateAdminConference(filters: AdminConferencesFilters = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: number; patch: Record<string, unknown> }) => api.patch(`/admin/conferences/${id}`, patch),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.conferences(filters) });
      invalidateAdminConferences(queryClient);
      invalidateAdminAudit(queryClient);
      queryClient.invalidateQueries({ queryKey: queryKeys.conferences.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.conferences.lists });
    },
  });
}

export function useModerateConference(filters: AdminConferencesFilters = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ConferenceModerationPayload }) =>
      api.post<Conference>(`/admin/conferences/${id}/moderate`, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.conferences(filters) });
      invalidateAdminConferences(queryClient);
      invalidateAdminAudit(queryClient);
      queryClient.invalidateQueries({ queryKey: queryKeys.conferences.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.conferences.my });
      queryClient.invalidateQueries({ queryKey: queryKeys.conferences.lists });
    },
  });
}
