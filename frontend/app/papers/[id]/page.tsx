'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getUploadUrl } from '@/lib/api';
import { RECOMMENDATION_LABELS } from '@/lib/types';
import { getApiErrorMessage } from '@/lib/errors';
import { formatDateTime } from '@/lib/format';
import { usePaper } from '@/lib/queries';
import { usePaperDetailMutations } from '@/hooks/usePaperDetailMutations';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Alert } from '@/components/ui/Alert';
import { EmptyState } from '@/components/ui/EmptyState';
import { SubmissionStepper } from '@/components/papers/SubmissionStepper';
import { getSubmissionStep } from '@/lib/submitPaperStep';

function PaperDetailContent() {
  const { id } = useParams();
  const router = useRouter();
  const paperQuery = usePaper(id as string);
  const paper = paperQuery.data;
  const [error, setError] = useState('');
  const confirm = useConfirm();
  const { withdrawMutation, deleteMutation } = usePaperDetailMutations(id as string);

  const handleWithdraw = async () => {
    if (!(await confirm('Отозвать подачу статьи?'))) return;
    try {
      await withdrawMutation.mutateAsync();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Не удалось отозвать подачу'));
    }
  };

  const handleDelete = async () => {
    if (!(await confirm('Удалить черновик?'))) return;
    try {
      await deleteMutation.mutateAsync();
      router.push('/my-papers');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Не удалось удалить черновик'));
    }
  };

  if (paperQuery.isLoading) return <LoadingSpinner />;

  if (error || paperQuery.error || !paper) {
    return (
      <EmptyState
        title="Статья недоступна"
        description={error || getApiErrorMessage(paperQuery.error, 'Статья не найдена или у вас нет доступа')}
        actionLabel="К моим статьям"
        actionHref="/my-papers"
      />
    );
  }

  const titleLabel = paper.title.length > 40 ? `${paper.title.slice(0, 40)}…` : paper.title;
  const activeRevision = paper.revision_requests?.find((request) => !request.resolved_at);

  return (
    <>
      <PageHeader
        title={paper.title}
        description={paper.conference_title}
        breadcrumbs={[
          { label: 'Мои статьи', href: '/my-papers' },
          { label: titleLabel },
        ]}
        action={<StatusBadge status={paper.status} />}
      />
      {(paper.status === 'draft' || paper.status === 'revision_required') && (
        <SubmissionStepper
          currentStep={getSubmissionStep({
            existingPaperId: paper.id,
            paper,
            hasNewFile: false,
          })}
          paperStatus={paper.status}
        />
      )}
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="space-y-6 lg:col-span-2">
          {activeRevision && (
            <Alert variant="warning">
              <strong>Доработка, раунд {activeRevision.round_number}:</strong> {activeRevision.comment}
            </Alert>
          )}
          <Card>
            <h2 className="mb-2 font-semibold">Аннотация</h2>
            <p className="text-slate-700">{paper.abstract || 'Аннотация не заполнена'}</p>
            {paper.keywords && paper.keywords.length > 0 && (
              <p className="mt-4 flex flex-wrap gap-2">
                {paper.keywords.map((k) => (
                  <span key={k} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">
                    {k}
                  </span>
                ))}
              </p>
            )}
          </Card>
          {paper.co_authors && paper.co_authors.length > 0 && (
            <Card>
              <h2 className="mb-3 font-semibold">Соавторы</h2>
              <ul className="space-y-2 text-sm">
                {paper.co_authors.map((a, i) => (
                  <li key={i}>
                    {a.full_name}
                    {a.affiliation ? ` · ${a.affiliation}` : ''}
                  </li>
                ))}
              </ul>
            </Card>
          )}
          {paper.reviews && paper.reviews.length > 0 && (
            <Card>
              <h2 className="mb-4 font-semibold">Рецензии</h2>
              <ul className="space-y-4">
                {paper.reviews.map((r) => (
                  <li key={r.id} className="rounded-lg border border-slate-200 p-4">
                    <p className="text-sm font-medium text-slate-600">
                      {r.reviewer_name || 'Рецензент'}
                      {r.recommendation && ` · ${RECOMMENDATION_LABELS[r.recommendation] || r.recommendation}`}
                    </p>
                    {r.comment_for_author && (
                      <p className="mt-2 text-sm text-slate-800">{r.comment_for_author}</p>
                    )}
                    {(r.score_relevance != null || r.score_novelty != null) && (
                      <p className="mt-2 text-xs text-slate-500">
                        Оценки: актуальность {r.score_relevance ?? '—'}, новизна {r.score_novelty ?? '—'},
                        ясность {r.score_clarity ?? '—'}, методология {r.score_methodology ?? '—'}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </Card>
          )}
          {paper.versions && paper.versions.length > 0 && (
            <Card>
              <h2 className="mb-4 font-semibold">История версий</h2>
              <ul className="space-y-3">
                {paper.versions.map((version) => (
                  <li key={version.id} className="rounded-lg border border-slate-200 p-4 text-sm">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium">Версия {version.version_number}</p>
                      <span className="text-slate-500">
                        {version.submitted_at ? `Подана: ${formatDateTime(version.submitted_at)}` : `Создана: ${formatDateTime(version.created_at)}`}
                      </span>
                    </div>
                    <p className="text-slate-700">{version.title}</p>
                    {version.file_url && (
                      <a
                        href={getUploadUrl(version.file_url) || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-block text-brand-600 hover:underline"
                      >
                        {version.file_name || 'PDF версии'}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </section>
        <aside className="space-y-4">
          <Card>
            <h3 className="mb-3 font-semibold">Действия</h3>
            <nav className="flex flex-col gap-2">
              {(paper.status === 'draft' || paper.status === 'revision_required') && (
                <Link href={`/submit-paper?paperId=${paper.id}`}>
                  <Button className="w-full">
                    {paper.status === 'revision_required' ? 'Загрузить новую версию' : 'Редактировать'}
                  </Button>
                </Link>
              )}
              {paper.file_url && (
                <a href={getUploadUrl(paper.file_url) || '#'} target="_blank" rel="noopener noreferrer">
                  <Button variant="secondary" className="w-full">
                    Скачать PDF
                  </Button>
                </a>
              )}
              {['submitted', 'under_review', 'revision_required'].includes(paper.status) &&
                paper.status !== 'accepted' && (
                  <Button variant="secondary" onClick={handleWithdraw}>
                    Отозвать подачу
                  </Button>
                )}
              {paper.status === 'draft' && (
                <Button variant="danger" onClick={handleDelete}>
                  Удалить черновик
                </Button>
              )}
            </nav>
          </Card>
          {paper.status === 'revision_required' && (
            <Alert variant="warning">
              Требуется доработка. Обновите текст и загрузите PDF заново.
              {activeRevision ? ` Комментарий: ${activeRevision.comment}` : ''}
            </Alert>
          )}
        </aside>
      </div>
    </>
  );
}

export default function PaperDetailPage() {
  return (
    <RequireAuth>
      <PaperDetailContent />
    </RequireAuth>
  );
}
