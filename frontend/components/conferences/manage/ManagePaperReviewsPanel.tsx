'use client';

import { RECOMMENDATION_LABELS, type Review } from '@/lib/types';

interface ManagePaperReviewsPanelProps {
  reviews: Review[];
}

export function ManagePaperReviewsPanel({ reviews }: ManagePaperReviewsPanelProps) {
  if (reviews.length === 0) return null;

  return (
    <ul className="mt-4 space-y-2 border-t pt-4">
      {reviews.map((r) => (
        <li key={r.id} className="rounded border p-3 text-sm">
          <p className="font-medium">
            {r.reviewer_name} · {r.recommendation ? RECOMMENDATION_LABELS[r.recommendation] || r.recommendation : 'в процессе'}
          </p>
          <p className="text-slate-600">{r.comment_for_author}</p>
          {r.comment_for_chair && <p className="text-slate-500">Для председателя: {r.comment_for_chair}</p>}
        </li>
      ))}
    </ul>
  );
}
