'use client';

import { useUpsertPaper } from '@/lib/queries';
import type { PaperDraftFormValues } from '@/lib/validation';
import type { PaperAuthor } from '@/lib/types';

export function usePaperSubmission(existingPaperId: number | null, coAuthors: PaperAuthor[]) {
  const upsertPaperMutation = useUpsertPaper();
  return {
    ...upsertPaperMutation,
    mutate: (values: PaperDraftFormValues) =>
      upsertPaperMutation.mutate({ values, coAuthors, existingPaperId }),
    mutateAsync: (values: PaperDraftFormValues) =>
      upsertPaperMutation.mutateAsync({ values, coAuthors, existingPaperId }),
  };
}
