'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getReviewDeadlineState } from '@/lib/conferenceManage';
import { useManageConferenceState } from '@/hooks/useManageConferenceState';
import { useConferenceManageAccess } from '@/lib/queries';
import { ManagePapersTab } from '@/components/conferences/manage/ManagePapersTab';
import { ManageReviewersTab } from '@/components/conferences/manage/ManageReviewersTab';
import { ManageOverviewTab } from '@/components/conferences/manage/ManageOverviewTab';
import { ManageParticipantsTab } from '@/components/conferences/manage/ManageParticipantsTab';
import { ManageTracksTab } from '@/components/conferences/manage/ManageTracksTab';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { PageHeader } from '@/components/ui/PageHeader';
import { Tabs } from '@/components/ui/Tabs';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { QueryState } from '@/components/ui/QueryState';
import { MetricCard } from '@/components/ui/MetricCard';

function ManageContent() {
  const { id } = useParams();
  const conferenceId = id as string;
  const accessQuery = useConferenceManageAccess(conferenceId);
  const state = useManageConferenceState(conferenceId);
  const trackChairOnly = accessQuery.data?.access === 'tracks';

  if (accessQuery.isError) {
    return <Alert variant="error">Нет доступа к управлению этой конференцией</Alert>;
  }

  if (accessQuery.isLoading || state.loading) {
    return <LoadingSpinner />;
  }

  return (
    <QueryState loading={false} error={state.error}>
      <PageHeader
        title={state.conf ? `Управление: ${state.conf.title}` : 'Управление'}
        breadcrumbs={[{ label: 'Конференции', href: '/my-conferences' }, { label: 'Управление' }]}
        action={
          <nav className="flex gap-2">
            <Link href={`/conference-program/${conferenceId}`}>
              <Button variant="ghost">Программа</Button>
            </Link>
            <Link href={`/conference-proceedings/${conferenceId}`}>
              <Button variant="ghost">Сборник</Button>
            </Link>
            <Link href={`/conference-site/${conferenceId}`}>
              <Button variant="ghost">Сайт</Button>
            </Link>
          </nav>
        }
      />
      {state.msg && (
        <Alert variant="success" className="mb-4">
          {state.msg}
        </Alert>
      )}
      {state.conf && getReviewDeadlineState(state.conf.review_deadline) !== 'ok' && (
        <Alert
          variant={getReviewDeadlineState(state.conf.review_deadline) === 'overdue' ? 'error' : 'warning'}
          className="mb-4"
        >
          {getReviewDeadlineState(state.conf.review_deadline) === 'overdue'
            ? 'Дедлайн рецензирования истёк. Новые рецензии будут заблокированы.'
            : 'Дедлайн рецензирования скоро истекает.'}
        </Alert>
      )}
      {state.reviewProgress && (
        <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <MetricCard label="Статей" value={state.reviewProgress.papers_total} />
          <MetricCard label="Назначений" value={state.reviewProgress.assignments_total} />
          <MetricCard label="Завершено" value={state.reviewProgress.reviews_completed} />
          <MetricCard label="Ожидают" value={state.reviewProgress.reviews_pending} />
          <MetricCard label="Просрочено" value={state.reviewProgress.reviews_overdue} />
        </section>
      )}
      <Tabs
        tabs={[
          { id: 'papers', label: 'Статьи' },
          ...(!trackChairOnly
            ? [
                { id: 'reviewers', label: 'Рецензенты' },
                { id: 'overview', label: 'Обзор' },
                { id: 'participants', label: 'Участники' },
                { id: 'tracks', label: 'Треки' },
              ]
            : []),
        ]}
        active={state.tab}
        onChange={state.setTab}
      />
      {state.tab === 'papers' && (
        <ManagePapersTab conferenceId={conferenceId} conf={state.conf} onMessage={state.setMsg} />
      )}
      {!trackChairOnly && state.tab === 'reviewers' && (
        <ManageReviewersTab
          reviewers={state.reviewers}
          addReviewerMutation={state.addReviewerMutation}
          removeReviewerMutation={state.removeReviewerMutation}
          onAddReviewer={async (userId) => {
            await state.addReviewerMutation.mutateAsync(userId);
          }}
        />
      )}
      {!trackChairOnly && state.tab === 'overview' && state.conf && (
        <ManageOverviewTab
          conference={state.conf}
          conferenceId={conferenceId}
          papers={state.papers}
          registrationsCount={state.registrations.length}
          analytics={state.analyticsQuery.data}
          analyticsLoading={state.analyticsQuery.isLoading}
        />
      )}
      {!trackChairOnly && state.tab === 'participants' && (
        <ManageParticipantsTab registrations={state.registrations} onExport={state.exportRegistrations} />
      )}
      {!trackChairOnly && state.tab === 'tracks' && <ManageTracksTab conferenceId={conferenceId} />}
    </QueryState>
  );
}

export default function ConferenceManagePage() {
  return (
    <RequireAuth>
      <ManageContent />
    </RequireAuth>
  );
}
