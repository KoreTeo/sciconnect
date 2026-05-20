import type { Paper } from '@/lib/types';

export const SUBMISSION_STEPS = ['Черновик', 'PDF', 'Подача', 'Оплата'] as const;

export function getSubmissionStep(opts: {
  existingPaperId: number | null;
  paper?: Paper | null;
  hasNewFile: boolean;
  paymentStep?: boolean;
}): number {
  if (opts.paymentStep) return 4;

  const paper = opts.paper;
  if (!opts.existingPaperId) return 1;

  const status = paper?.status || 'draft';
  if (['submitted', 'under_review', 'accepted', 'rejected'].includes(status)) {
    return 3;
  }

  const hasMeta =
    Boolean(paper?.title?.trim()) && Boolean((paper?.abstract || '').trim().length >= 20);
  if (!hasMeta) return 1;

  const hasPdf = Boolean(paper?.file_url || opts.hasNewFile);
  if (!hasPdf) return 2;

  return 3;
}
