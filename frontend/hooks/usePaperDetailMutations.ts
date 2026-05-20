'use client';

import { useDeletePaper, useWithdrawPaper } from '@/lib/queries';

export function usePaperDetailMutations(paperId: string) {
  const withdrawPaperMutation = useWithdrawPaper();
  const deletePaperMutation = useDeletePaper();

  const withdrawMutation = {
    ...withdrawPaperMutation,
    mutate: () => withdrawPaperMutation.mutate(paperId),
    mutateAsync: () => withdrawPaperMutation.mutateAsync(paperId),
  };

  const deleteMutation = {
    ...deletePaperMutation,
    mutate: () => deletePaperMutation.mutate(paperId),
    mutateAsync: () => deletePaperMutation.mutateAsync(paperId),
  };

  return { withdrawMutation, deleteMutation };
}
