'use client';

import Link from 'next/link';
import { RECOMMENDATION_LABELS, type Review } from '@/lib/types';
import { formatDateTime } from '@/lib/format';
import { getReviewDeadlineState } from '@/lib/conferenceManage';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { StatusBadge } from '@/components/ui/Badge';
import { useMyReviews } from '@/lib/queries';

function ReviewsContent() {
  const { data: reviews = [], isLoading } = useMyReviews();
  const sorted = [...reviews].sort((a, b) => reviewPriority(a) - reviewPriority(b));

  if (isLoading) return <LoadingSpinner />;

  return (
    <>
      <PageHeader title="Мои рецензии" description="Назначенные статьи и сроки сдачи" />
      {sorted.length === 0 ? (
        <EmptyState title="Назначенных рецензий нет" description="Организатор назначит вас на статьи конференции" />
      ) : (
        <ul className="space-y-4">
          {sorted.map((review) => {
            const done = !!review.recommendation;
            const deadlineState = getReviewDeadlineState(review.review_deadline);
            const title = review.paper_title || `Статья #${review.paper_id}`;
            return (
              <li key={review.id}>
                <Card>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h2 className="font-semibold">{title}</h2>
                      {review.conference_title && <p className="text-sm text-slate-500">{review.conference_title}</p>}
                    </div>
                    <StatusBadge
                      status={done ? 'accepted' : deadlineState === 'overdue' ? 'rejected' : 'under_review'}
                      label={done ? 'Сдана' : deadlineState === 'overdue' ? 'Просрочено' : deadlineState === 'soon' ? 'Скоро дедлайн' : 'В работе'}
                    />
                  </div>
                  {review.review_deadline && (
                    <p className="mb-3 text-sm text-slate-600">
                      Дедлайн рецензий: {formatDateTime(review.review_deadline)}
                    </p>
                  )}
                  {review.recommendation && (
                    <p className="mb-3 text-sm">Рекомендация: {RECOMMENDATION_LABELS[review.recommendation] || review.recommendation}</p>
                  )}
                  <Link href={`/reviews/${review.paper_id}`} aria-label={done ? `Просмотреть рецензию на статью ${title}` : `Заполнить рецензию на статью ${title}`}>
                    <Button variant="secondary">{done ? 'Просмотр' : 'Заполнить рецензию'}</Button>
                  </Link>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

function reviewPriority(review: Review) {
  if (review.recommendation) return 3;
  const state = getReviewDeadlineState(review.review_deadline);
  if (state === 'overdue') return 0;
  if (state === 'soon') return 1;
  return 2;
}

export default function ReviewsPage() {
  return (
    <RequireAuth roles={['reviewer', 'organizer', 'admin']}>
      <ReviewsContent />
    </RequireAuth>
  );
}
