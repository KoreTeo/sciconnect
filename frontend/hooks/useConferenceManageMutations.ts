'use client';

import {
  useAddConferenceReviewer,
  usePaperDecision,
  useRemoveConferenceReviewer,
} from '@/lib/queries/conferences';

export function useConferenceManageMutations(
  conferenceId: string,
  options?: { onMessage?: (message: string) => void; expandedPaperId?: number | null }
) {
  const addReviewerMutation = useAddConferenceReviewer(conferenceId);
  const removeReviewerMutation = useRemoveConferenceReviewer(conferenceId);
  const decisionMutation = usePaperDecision(conferenceId);

  return {
    addReviewerMutation: {
      ...addReviewerMutation,
      mutateAsync: async (userId: number) => {
        const result = await addReviewerMutation.mutateAsync(userId);
        options?.onMessage?.('Рецензент добавлен в пул');
        return result;
      },
    },
    removeReviewerMutation,
    decisionMutation: {
      ...decisionMutation,
      mutateAsync: async (vars: { paperId: number; status: string }) => {
        const result = await decisionMutation.mutateAsync(vars);
        options?.onMessage?.('Статус обновлён');
        return result;
      },
    },
  };
}
