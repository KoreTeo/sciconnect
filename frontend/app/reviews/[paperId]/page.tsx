'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { getUploadUrl } from '@/lib/api';
import { RECOMMENDATION_LABELS } from '@/lib/types';
import { getReviewDeadlineState } from '@/lib/conferenceManage';
import { getApiErrorMessage } from '@/lib/errors';
import { useMyReviewForPaper, usePaper, useSubmitReview, useDeclareReviewConflict } from '@/lib/queries';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { Modal } from '@/components/ui/Modal';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ReviewCriteriaForm } from '@/components/reviews/ReviewCriteriaForm';
import { reviewSchema, type ReviewFormValues } from '@/lib/validation';
import { formatDateTime } from '@/lib/format';

function ReviewFormContent() {
  const { paperId } = useParams();
  const router = useRouter();
  const paperQuery = usePaper(paperId as string);
  const myReviewQuery = useMyReviewForPaper(paperId as string);
  const paper = paperQuery.data;
  const myReview = myReviewQuery.data;
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingValues, setPendingValues] = useState<ReviewFormValues | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      score_relevance: 3,
      score_novelty: 3,
      score_clarity: 3,
      score_methodology: 3,
      comment_for_author: '',
      comment_for_chair: '',
      recommendation: 'accept',
    },
  });
  const deadlineState = getReviewDeadlineState(myReview?.review_deadline);
  const readonly = !!myReview?.recommendation;
  const blocked = !readonly && deadlineState === 'overdue';
  const watchedScores = watch(['score_relevance', 'score_novelty', 'score_clarity', 'score_methodology']);
  const averageScore = watchedScores.reduce((sum, score) => sum + (Number(score) || 0), 0) / watchedScores.length;

  useEffect(() => {
    if (!myReview) return;
    reset({
      score_relevance: myReview.score_relevance || 3,
      score_novelty: myReview.score_novelty || 3,
      score_clarity: myReview.score_clarity || 3,
      score_methodology: myReview.score_methodology || 3,
      comment_for_author: myReview.comment_for_author || '',
      comment_for_chair: myReview.comment_for_chair || '',
      recommendation: (myReview.recommendation || 'accept') as ReviewFormValues['recommendation'],
    });
  }, [myReview, reset]);

  const saveReviewMutation = useSubmitReview(paperId as string, myReview?.id);
  const declareConflictMutation = useDeclareReviewConflict(paperId as string);

  const openConfirm = (values: ReviewFormValues) => {
    if (readonly || blocked) return;
    setPendingValues(values);
    setConfirmOpen(true);
  };

  const confirmSubmit = async () => {
    if (!pendingValues) return;
    try {
      await saveReviewMutation.mutateAsync(pendingValues);
      setConfirmOpen(false);
      router.push('/reviews');
    } catch (err) {
      setError('root', { message: getApiErrorMessage(err, 'Ошибка отправки рецензии') });
      setConfirmOpen(false);
    }
  };

  if (paperQuery.isLoading || myReviewQuery.isLoading) return <LoadingSpinner />;
  if (!paper) return <Alert variant="error">Статья не найдена</Alert>;

  return (
    <>
      <PageHeader title="Рецензия" breadcrumbs={[{ label: 'Рецензии', href: '/reviews' }, { label: paper.title.slice(0, 40) }]} />
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-1">
          <Card>
            <h2 className="mb-2 font-semibold">{paper.title}</h2>
            <p className="mb-4 text-sm text-slate-600">{paper.abstract}</p>
            {paper.keywords && <p className="mb-4 text-xs text-slate-500">{paper.keywords.join(', ')}</p>}
            {paper.file_url && (
              <a href={getUploadUrl(paper.file_url) || '#'} target="_blank" rel="noopener noreferrer">
                <Button variant="secondary" className="w-full">
                  Открыть PDF
                </Button>
              </a>
            )}
          </Card>
        </section>
        <section className="lg:col-span-2">
          <Card>
            {myReview?.review_deadline && (
              <Alert
                variant={deadlineState === 'overdue' ? 'error' : deadlineState === 'soon' ? 'warning' : 'info'}
                className="mb-4"
              >
                Дедлайн рецензии: {formatDateTime(myReview.review_deadline)}
                {deadlineState === 'overdue'
                  ? '. Срок истёк, отправка заблокирована.'
                  : deadlineState === 'soon'
                    ? '. Осталось меньше 3 дней.'
                    : ''}
              </Alert>
            )}
            {myReview?.conflict_declared && (
              <Alert variant="warning" className="mb-4">
                Вы заявили конфликт интересов. Отправка рецензии недоступна.
              </Alert>
            )}
            {readonly && <Alert variant="info" className="mb-4">Рецензия уже отправлена (режим просмотра).</Alert>}
            {blocked && (
              <Alert variant="error" className="mb-4">
                Дедлайн истёк. Обратитесь к организатору, если нужна повторная отправка.
              </Alert>
            )}
            <form onSubmit={handleSubmit(openConfirm)} className="space-y-4">
              <ReviewCriteriaForm
                register={register}
                errors={errors}
                disabled={readonly || blocked}
                scores={watchedScores}
              />
              {errors.root?.message && <Alert variant="error">{errors.root.message}</Alert>}
              {!readonly && !blocked && !myReview?.conflict_declared && (
                <div className="flex flex-wrap gap-2">
                  <Button type="submit" disabled={isSubmitting || saveReviewMutation.isPending}>
                    {isSubmitting || saveReviewMutation.isPending ? 'Отправка...' : 'Отправить рецензию'}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={declareConflictMutation.isPending}
                    onClick={async () => {
                      try {
                        await declareConflictMutation.mutateAsync();
                        router.push('/reviews');
                      } catch (err) {
                        setError('root', { message: getApiErrorMessage(err, 'Не удалось зафиксировать конфликт интересов') });
                      }
                    }}
                  >
                    Есть конфликт интересов
                  </Button>
                </div>
              )}
            </form>
          </Card>
        </section>
      </div>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Подтвердите отправку рецензии">
        {pendingValues && (
          <div className="space-y-4 text-sm text-slate-700">
            <p>
              Средняя оценка: <strong>{averageScore.toFixed(1)}</strong> / 5
            </p>
            <p>
              Рекомендация:{' '}
              <strong>{RECOMMENDATION_LABELS[pendingValues.recommendation] || pendingValues.recommendation}</strong>
            </p>
            <p className="text-amber-800">После отправки изменить рецензию будет нельзя.</p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={confirmSubmit} disabled={saveReviewMutation.isPending}>
                {saveReviewMutation.isPending ? 'Отправка...' : 'Отправить окончательно'}
              </Button>
              <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
                Отмена
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

export default function ReviewFormPage() {
  return (
    <RequireAuth roles={['reviewer', 'organizer', 'admin']}>
      <ReviewFormContent />
    </RequireAuth>
  );
}
