import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api';
import type { Review, ReviewAssignment, ReviewProgressSummary } from '../types';
import { queryKeys } from '../queryKeys';

export interface AssignReviewerPayload {
  userId: number;
  paperId: number;
}

export interface MyReviewsOptions {
  paperId?: string | number;
  enabled?: boolean;
}

export function useReviewProgress(conferenceId?: string | number) {
  return useQuery({
    queryKey: queryKeys.reviews.progress(conferenceId),
    queryFn: async () => (await api.get<ReviewProgressSummary>(`/conferences/${conferenceId}/review-progress`)).data,
    enabled: !!conferenceId,
  });
}

export function useReviewAssignments(conferenceId?: string | number, enabled = true) {
  return useQuery({
    queryKey: queryKeys.reviews.assignments(conferenceId),
    queryFn: async () => (await api.get<ReviewAssignment[]>(`/conferences/${conferenceId}/review-assignments`)).data,
    enabled: !!conferenceId && enabled,
  });
}

export function useAssignReviewer(conferenceId?: string | number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, paperId }: AssignReviewerPayload) =>
      api.post(`/conferences/${conferenceId}/assign-reviewer`, { user_id: userId, paper_id: paperId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conferences.papers(conferenceId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.reviews.assignments(conferenceId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.reviews.progress(conferenceId) });
    },
  });
}

export function useUnassignReview(conferenceId?: string | number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reviewId: number) => api.delete(`/reviews/${reviewId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conferences.papers(conferenceId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.reviews.assignments(conferenceId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.reviews.progress(conferenceId) });
    },
  });
}

export function useMyReviews(options: MyReviewsOptions = {}) {
  const { paperId, enabled = true } = options;
  return useQuery({
    queryKey: paperId != null ? queryKeys.reviews.myForPaper(paperId) : queryKeys.reviews.my,
    queryFn: async () =>
      (
        await api.get<Review[]>('/reviews/my', {
          params: {
            limit: 100,
            ...(paperId != null ? { paper_id: Number(paperId) } : {}),
          },
        })
      ).data,
    enabled,
    retry: 1,
  });
}

export function useMyReviewForPaper(paperId?: string | number) {
  const query = useMyReviews({ paperId, enabled: !!paperId });
  return {
    ...query,
    data: query.data?.[0] ?? null,
  };
}

export function usePaperReviews(paperId?: string | number, enabled = true) {
  return useQuery({
    queryKey: queryKeys.reviews.byPaper(paperId),
    queryFn: async () => (await api.get<Review[]>(`/papers/${paperId}/reviews`)).data,
    enabled: !!paperId && enabled,
  });
}

export function useSubmitReview(paperId?: string | number, reviewId?: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: Record<string, unknown>) =>
      reviewId
        ? api.put(`/reviews/${reviewId}`, values)
        : api.post('/reviews', { paper_id: Number(paperId), ...values }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reviews.my });
      queryClient.invalidateQueries({ queryKey: queryKeys.reviews.byPaper(paperId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.papers.detail(paperId) });
      queryClient.invalidateQueries({ queryKey: ['reviews', 'progress'] });
      queryClient.invalidateQueries({ queryKey: ['reviews', 'assignments'] });
      if (paperId != null) {
        queryClient.invalidateQueries({ queryKey: queryKeys.reviews.myForPaper(paperId) });
      }
    },
  });
}

export function useDeclareReviewConflict(paperId?: string | number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post(`/reviews/${paperId}/declare-conflict`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reviews.myForPaper(paperId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.reviews.my });
    },
  });
}
