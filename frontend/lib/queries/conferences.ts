import { keepPreviousData, useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import api from '../api';
import type { Conference, ConferenceManageAccess, ConferenceTrack, ConferenceAnalytics, Paper, ProgramSession, Registration, SiteSettings } from '../types';
import { queryKeys } from '../queryKeys';
import { toRegistrationApiPayload, type ConferenceRegistrationPayload } from '../registration';

export interface Reviewer {
  id: number;
  user_id: number;
  full_name: string;
  email: string;
}

export interface ConferenceSiteResponse {
  theme_json: SiteSettings;
  is_published: boolean;
}

export interface ConferenceFilters {
  search?: string;
  format?: string;
  skip?: number;
  limit?: number;
}

export function useConferences(filters: ConferenceFilters = {}) {
  return useQuery({
    queryKey: queryKeys.conferences.all(filters),
    queryFn: async () => (await api.get<Conference[]>('/conferences', { params: filters })).data,
    placeholderData: keepPreviousData,
  });
}

export function useMyConferences(enabled = true) {
  return useQuery({
    queryKey: queryKeys.conferences.my,
    queryFn: async () => (await api.get<Conference[]>('/conferences/my/list')).data,
    enabled,
  });
}

export function useSubmitConferenceForApproval() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, comment }: { id: number; comment?: string }) =>
      api.post<Conference>(`/conferences/${id}/submit-for-approval`, { comment }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conferences.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.conferences.my });
      queryClient.invalidateQueries({ queryKey: ['admin'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.conferences.lists });
    },
  });
}

export function useMyRegistrations() {
  return useQuery({
    queryKey: queryKeys.conferences.myRegistrations,
    queryFn: async () => (await api.get<Registration[]>('/conferences/my/registrations')).data,
  });
}

export function useConference(id?: string | number) {
  return useQuery({
    queryKey: queryKeys.conferences.detail(id),
    queryFn: async () => (await api.get<Conference>(`/conferences/${id}`)).data,
    enabled: !!id,
  });
}

export function useCreateConference() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) =>
      (await api.post<Conference>('/conferences/', payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conferences.my });
      queryClient.invalidateQueries({ queryKey: queryKeys.conferences.lists });
    },
  });
}

export function useUpdateConference(id?: string | number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) =>
      (await api.put<Conference>(`/conferences/${id}`, payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conferences.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.conferences.my });
      queryClient.invalidateQueries({ queryKey: queryKeys.conferences.lists });
    },
  });
}

export function useConferencePapers(id?: string | number, filters?: { status?: string; skip?: number; limit?: number }, enabled = true) {
  return useQuery({
    queryKey: queryKeys.conferences.papers(id, filters),
    queryFn: async () => (await api.get<Paper[]>(`/papers/conference/${id}`, { params: filters })).data,
    enabled: !!id && enabled,
    placeholderData: keepPreviousData,
  });
}

export function useConferenceReviewers(id?: string | number, enabled = true) {
  return useQuery({
    queryKey: queryKeys.conferences.reviewers(id),
    queryFn: async () => (await api.get<Reviewer[]>(`/conferences/${id}/reviewers`)).data,
    enabled: !!id && enabled,
  });
}

export function useConferenceRegistrations(id?: string | number, enabled = true) {
  return useQuery({
    queryKey: queryKeys.conferences.registrations(id),
    queryFn: async () => (await api.get<Registration[]>(`/conferences/${id}/registrations`)).data,
    enabled: !!id && enabled,
    placeholderData: keepPreviousData,
  });
}

export function useConferenceProgram(id?: string | number, enabled = true) {
  return useQuery({
    queryKey: queryKeys.conferences.program(id),
    queryFn: async () => (await api.get<ProgramSession[]>(`/conferences/${id}/program`)).data,
    enabled: !!id && enabled,
  });
}

export function useConferenceSite(id?: string | number) {
  return useQuery({
    queryKey: queryKeys.conferences.site(id),
    queryFn: async () => (await api.get<ConferenceSiteResponse>(`/conferences/${id}/site`)).data,
    enabled: !!id,
  });
}

export function invalidateConferenceManage(
  queryClient: QueryClient,
  conferenceId: string | number,
  expandedPaperId?: number | null
) {
  queryClient.invalidateQueries({ queryKey: queryKeys.conferences.detail(conferenceId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.conferences.papers(conferenceId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.conferences.reviewers(conferenceId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.conferences.registrations(conferenceId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.conferences.analytics(conferenceId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.reviews.progress(conferenceId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.reviews.assignments(conferenceId) });
  if (expandedPaperId) {
    queryClient.invalidateQueries({ queryKey: queryKeys.reviews.byPaper(expandedPaperId) });
  }
}

export function useAddConferenceReviewer(conferenceId?: string | number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: number) => api.post(`/conferences/${conferenceId}/reviewers?user_id=${userId}`),
    onSuccess: () => invalidateConferenceManage(queryClient, conferenceId!),
  });
}

export function useRemoveConferenceReviewer(conferenceId?: string | number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: number) => api.delete(`/conferences/${conferenceId}/reviewers/${userId}`),
    onSuccess: () => invalidateConferenceManage(queryClient, conferenceId!),
  });
}

export function usePaperDecision(conferenceId?: string | number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ paperId, status }: { paperId: number; status: string }) =>
      api.put(`/papers/${paperId}/decision`, { status }),
    onSuccess: () => invalidateConferenceManage(queryClient, conferenceId!),
  });
}

export function useRegisterForConference(conferenceId?: string | number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ConferenceRegistrationPayload) =>
      (
        await api.post(`/conferences/${conferenceId}/register`, toRegistrationApiPayload(payload))
      ).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conferences.myRegistrations });
      if (conferenceId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.conferences.registrations(conferenceId) });
      }
    },
  });
}

export function useConferenceAnalytics(id?: string | number, enabled = true) {
  return useQuery({
    queryKey: queryKeys.conferences.analytics(id),
    queryFn: async () => (await api.get<ConferenceAnalytics>(`/conferences/${id}/analytics`)).data,
    enabled: !!id && enabled,
  });
}

export function useConferenceManageAccess(id?: string | number, enabled = true) {
  return useQuery({
    queryKey: queryKeys.conferences.manageAccess(id),
    queryFn: async () => (await api.get<ConferenceManageAccess>(`/conferences/${id}/manage-access`)).data,
    enabled: !!id && enabled,
    retry: false,
  });
}

export function useConferenceTracks(id?: string | number, enabled = true) {
  return useQuery({
    queryKey: queryKeys.conferences.tracks(id),
    queryFn: async () => (await api.get<ConferenceTrack[]>(`/conferences/${id}/tracks`)).data,
    enabled: !!id && enabled,
  });
}

export function useCreateConferenceTrack(conferenceId?: string | number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { name: string; slug: string; description?: string }) =>
      api.post<ConferenceTrack>(`/conferences/${conferenceId}/tracks`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conferences.tracks(conferenceId) });
    },
  });
}

export function useSaveConferenceProgram(conferenceId: string | number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: unknown) =>
      api.put(`/conferences/${conferenceId}/program`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conferences.program(conferenceId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.conferences.site(conferenceId) });
    },
  });
}

export function useSaveConferenceSite(conferenceId: string | number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (theme: SiteSettings) => api.put(`/conferences/${conferenceId}/site`, theme),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conferences.site(conferenceId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.conferences.detail(conferenceId) });
    },
  });
}

export function usePublishConferenceSite(conferenceId: string | number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post(`/conferences/${conferenceId}/site/publish`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conferences.site(conferenceId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.conferences.detail(conferenceId) });
    },
  });
}

export function useUnpublishConferenceSite(conferenceId: string | number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post(`/conferences/${conferenceId}/site/unpublish`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conferences.site(conferenceId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.conferences.detail(conferenceId) });
    },
  });
}
