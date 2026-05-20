import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api';
import type { Paper } from '../types';
import { queryKeys } from '../queryKeys';
import { toPaperPayload, type PaperDraftFormValues } from '../validation';

export interface RevisionRequestPayload {
  paperId: number;
  comment: string;
  conferenceId?: string | number;
}

export function useMyPapers() {
  return useQuery({
    queryKey: queryKeys.papers.my,
    queryFn: async () => (await api.get<Paper[]>('/papers/my', { params: { limit: 100 } })).data,
  });
}

export function usePaper(id?: string | number) {
  return useQuery({
    queryKey: queryKeys.papers.detail(id),
    queryFn: async () => (await api.get<Paper>(`/papers/${id}`)).data,
    enabled: !!id,
    retry: 1,
  });
}

export interface BulkRevisionSkipped {
  paper_id: number;
  reason: string;
}

export interface BulkPaperRevisionResponse {
  updated: Paper[];
  skipped: BulkRevisionSkipped[];
}

export function useBulkRequestPaperRevision(conferenceId?: string | number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ paperIds, comment }: { paperIds: number[]; comment: string }) =>
      (
        await api.post<BulkPaperRevisionResponse>(
          `/conferences/${conferenceId}/papers/bulk-request-revision`,
          { paper_ids: paperIds, comment }
        )
      ).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.papers.my });
      if (conferenceId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.conferences.papers(conferenceId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.reviews.assignments(conferenceId) });
      } else {
        queryClient.invalidateQueries({ queryKey: queryKeys.conferences.lists });
      }
    },
  });
}

export function useUploadPaperFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ paperId, file }: { paperId: number; file: File }) => {
      const form = new FormData();
      form.append('file', file);
      return (
        await api.post(`/papers/${paperId}/upload`, form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      ).data;
    },
    onSuccess: (_, { paperId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.papers.detail(paperId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.papers.my });
    },
  });
}

export function useUpsertPaper() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      values: PaperDraftFormValues;
      coAuthors: unknown[];
      existingPaperId?: number | null;
    }) => {
      const data = { ...toPaperPayload(payload.values), co_authors: payload.coAuthors };
      if (payload.existingPaperId) {
        await api.put(`/papers/${payload.existingPaperId}`, data);
        return payload.existingPaperId;
      }
      const created = await api.post<Paper>(`/papers/?conference_id=${payload.values.conference_id}`, data);
      return created.data.id;
    },
    onSuccess: (paperId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.papers.detail(paperId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.papers.my });
    },
  });
}

export function useWithdrawPaper() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (paperId: string | number) => api.post(`/papers/${paperId}/withdraw`),
    onSuccess: (_, paperId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.papers.detail(paperId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.papers.my });
    },
  });
}

export function useDeletePaper() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (paperId: string | number) => api.delete(`/papers/${paperId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.papers.my });
    },
  });
}

export function useSubmitPaper() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (paperId: number) => (await api.post(`/papers/${paperId}/submit`)).data,
    onSuccess: (_, paperId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.papers.detail(paperId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.papers.my });
    },
  });
}

export function useRequestPaperRevision() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ paperId, comment }: RevisionRequestPayload) =>
      api.post(`/papers/${paperId}/request-revision`, { comment }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.papers.detail(variables.paperId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.papers.my });
      if (variables.conferenceId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.conferences.papers(variables.conferenceId) });
      } else {
        queryClient.invalidateQueries({ queryKey: queryKeys.conferences.lists });
      }
    },
  });
}
