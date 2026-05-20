'use client';

import { memo } from 'react';
import { getUploadUrl } from '@/lib/api';
import { RECOMMENDATION_LABELS, type Conference, type Paper, type Recommendation } from '@/lib/types';
import { formatDateTime } from '@/lib/format';
import { getReviewDeadlineState } from '@/lib/conferenceManage';
import type { Reviewer } from '@/lib/queries/conferences';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select, Textarea } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { ManagePaperReviewsPanel } from './ManagePaperReviewsPanel';
import type { useRequestPaperRevision } from '@/lib/queries/papers';
import type { useAssignReviewer } from '@/lib/queries/reviews';

type Assignment = {
  paper_id: number;
  assigned_reviewers: {
    review_id: number;
    reviewer_id: number;
    reviewer_name?: string;
    reviewer_email?: string;
    is_completed: boolean;
    is_overdue: boolean;
    recommendation?: string;
  }[];
};

export interface ManagePaperCardProps {
  paper: Paper;
  conf?: Conference;
  reviewers: Reviewer[];
  assignment?: Assignment;
  assignUserId: string;
  revisionComment: string;
  expanded: boolean;
  showReviews: boolean;
  selected: boolean;
  onToggleSelection: () => void;
  onAssignChange: (userId: string) => void;
  onAssignReviewer: () => void;
  onLoadReviews: () => void;
  onSetDecision: (status: string) => void;
  onUnassignReview: (reviewId: number) => void;
  onRevisionCommentChange: (value: string) => void;
  onRequestRevision: () => void;
  assignReviewerMutation: ReturnType<typeof useAssignReviewer>;
  requestRevisionMutation: ReturnType<typeof useRequestPaperRevision>;
  paperReviews: import('@/lib/types').Review[];
}

export const ManagePaperCard = memo(function ManagePaperCard({
  paper: p,
  conf,
  reviewers,
  assignment,
  assignUserId,
  revisionComment,
  expanded,
  showReviews,
  selected,
  onToggleSelection,
  onAssignChange,
  onAssignReviewer,
  onLoadReviews,
  onSetDecision,
  onUnassignReview,
  onRevisionCommentChange,
  onRequestRevision,
  assignReviewerMutation,
  requestRevisionMutation,
  paperReviews,
}: ManagePaperCardProps) {
  const reviewerCount = assignment?.assigned_reviewers?.length || 0;
  const needsReviewer =
    ['submitted', 'under_review'].includes(p.status) &&
    reviewerCount === 0 &&
    conf &&
    getReviewDeadlineState(conf.review_deadline) !== 'ok';

  return (
    <Card className={needsReviewer ? 'border-amber-300 bg-amber-50/40' : undefined}>
      <header className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            className="mt-1"
            checked={selected}
            onChange={onToggleSelection}
            aria-label={`Выбрать статью ${p.title}`}
          />
          <div>
            <h3 className="font-medium">{p.title}</h3>
            <p className="text-sm text-slate-500">{p.author_name || `Автор #${p.author_id}`}</p>
          </div>
        </div>
        <StatusBadge status={p.status} />
      </header>
      <p className="mb-3 line-clamp-2 text-sm text-slate-600">{p.abstract}</p>
      <div className="mb-3 flex flex-wrap gap-3 text-xs text-slate-500">
        <span>Версий: {p.version_count ?? 0}</span>
        <span>Рецензий: {reviewerCount}</span>
        {p.submitted_at && <span>Подана: {formatDateTime(p.submitted_at)}</span>}
        {conf && <span>Дедлайн рецензий: {formatDateTime(conf.review_deadline)}</span>}
        {p.latest_revision_round && <span>Доработка: раунд {p.latest_revision_round}</span>}
        {needsReviewer && <span className="font-medium text-amber-800">Нет рецензента</span>}
      </div>
      {p.latest_revision_comment && (
        <Alert variant="warning" className="mb-3">
          Последняя доработка: {p.latest_revision_comment}
        </Alert>
      )}
      {assignment && assignment.assigned_reviewers.length > 0 && (
        <ul className="mb-3 flex flex-wrap gap-2 text-xs">
          {assignment.assigned_reviewers.map((reviewer) => (
            <li
              key={reviewer.review_id}
              className={`rounded-full px-3 py-1 ${reviewer.is_completed ? 'bg-green-50 text-green-700' : reviewer.is_overdue ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-800'}`}
            >
              {reviewer.reviewer_name || reviewer.reviewer_email || `Рецензент #${reviewer.reviewer_id}`}
              {' · '}
              {reviewer.is_completed
                ? RECOMMENDATION_LABELS[(reviewer.recommendation as Recommendation) || 'accept'] || 'сдана'
                : reviewer.is_overdue
                  ? 'просрочено'
                  : 'в работе'}
              {!reviewer.is_completed && (
                <button
                  type="button"
                  className="ml-2 underline"
                  aria-label={`Снять назначение рецензента со статьи ${p.title}`}
                  onClick={() => onUnassignReview(reviewer.review_id)}
                >
                  снять
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      <div className="mb-3 flex flex-wrap gap-2">
        <Select
          aria-label={`Рецензент для статьи ${p.title}`}
          value={assignUserId}
          onChange={(e) => onAssignChange(e.target.value)}
        >
          <option value="">Рецензент...</option>
          {reviewers.map((r) => (
            <option key={r.user_id} value={r.user_id}>
              {r.full_name}
            </option>
          ))}
        </Select>
        <Button variant="secondary" disabled={assignReviewerMutation.isPending} onClick={onAssignReviewer}>
          {assignReviewerMutation.isPending ? 'Назначение...' : 'Назначить'}
        </Button>
        {p.file_url && (
          <a href={getUploadUrl(p.file_url) || '#'} target="_blank" rel="noopener noreferrer">
            <Button variant="ghost">PDF</Button>
          </a>
        )}
        <Button variant="ghost" onClick={onLoadReviews}>
          Рецензии
        </Button>
      </div>
      <nav className="flex flex-wrap gap-2">
        <Button variant="ghost" onClick={() => onSetDecision('accepted')}>
          Принять
        </Button>
        <Button variant="ghost" onClick={() => onSetDecision('rejected')}>
          Отклонить
        </Button>
      </nav>
      {p.status !== 'accepted' && p.status !== 'rejected' && p.status !== 'draft' && (
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <Textarea
            label="Комментарий для доработки"
            rows={2}
            value={revisionComment}
            onChange={(e) => onRevisionCommentChange(e.target.value)}
            placeholder="Что нужно исправить автору?"
          />
          <Button variant="secondary" className="mt-2" disabled={requestRevisionMutation.isPending} onClick={onRequestRevision}>
            {requestRevisionMutation.isPending ? 'Отправка...' : 'Запросить доработку'}
          </Button>
        </div>
      )}
      {expanded && showReviews && <ManagePaperReviewsPanel reviews={paperReviews} />}
    </Card>
  );
});
