import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import api from '../api';
import type { ProceedingsExport, ProceedingsIssue } from '../types';
import { queryKeys } from '../queryKeys';

export interface ProceedingsEntryPayload {
  entryId: number;
  patch: Record<string, unknown>;
}

export function invalidateProceedings(queryClient: QueryClient, conferenceId?: string | number) {
  queryClient.invalidateQueries({ queryKey: queryKeys.proceedings.conference(conferenceId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.proceedings.export(conferenceId) });
}

export function useConferenceProceedings(conferenceId?: string | number) {
  return useQuery({
    queryKey: queryKeys.proceedings.conference(conferenceId),
    queryFn: async () => (await api.get<ProceedingsIssue>(`/conferences/${conferenceId}/proceedings`)).data,
    enabled: !!conferenceId,
  });
}

export function usePublicProceedings(shortName?: string) {
  return useQuery({
    queryKey: queryKeys.proceedings.public(shortName),
    queryFn: async () => (await api.get<ProceedingsIssue>(`/conferences/public/${shortName}/proceedings`)).data,
    enabled: !!shortName,
    retry: false,
  });
}

export function useProceedingsExport(conferenceId?: string | number, enabled = true) {
  return useQuery({
    queryKey: queryKeys.proceedings.export(conferenceId),
    queryFn: async () => (await api.get<ProceedingsExport>(`/conferences/${conferenceId}/proceedings/export`)).data,
    enabled: !!conferenceId && enabled,
  });
}

export function useUpdateProceedings(conferenceId?: string | number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: Record<string, unknown>) => api.patch(`/conferences/${conferenceId}/proceedings`, patch),
    onSuccess: () => invalidateProceedings(queryClient, conferenceId),
  });
}

export function useAddProceedingsEntry(conferenceId?: string | number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (paperId: number) => api.post(`/conferences/${conferenceId}/proceedings/entries`, { paper_id: paperId }),
    onSuccess: () => invalidateProceedings(queryClient, conferenceId),
  });
}

export function useUpdateProceedingsEntry(conferenceId?: string | number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ entryId, patch }: ProceedingsEntryPayload) =>
      api.patch(`/conferences/${conferenceId}/proceedings/entries/${entryId}`, patch),
    onSuccess: () => invalidateProceedings(queryClient, conferenceId),
  });
}

export function useRemoveProceedingsEntry(conferenceId?: string | number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (entryId: number) => api.delete(`/conferences/${conferenceId}/proceedings/entries/${entryId}`),
    onSuccess: () => invalidateProceedings(queryClient, conferenceId),
  });
}

export function usePublishProceedings(conferenceId?: string | number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post(`/conferences/${conferenceId}/proceedings/publish`),
    onSuccess: () => {
      invalidateProceedings(queryClient, conferenceId);
      queryClient.invalidateQueries({ queryKey: queryKeys.conferences.public });
    },
  });
}

export function useUnpublishProceedings(conferenceId?: string | number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post(`/conferences/${conferenceId}/proceedings/unpublish`),
    onSuccess: () => {
      invalidateProceedings(queryClient, conferenceId);
      queryClient.invalidateQueries({ queryKey: queryKeys.conferences.public });
    },
  });
}
