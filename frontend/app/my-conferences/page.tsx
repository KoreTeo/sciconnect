'use client';

import Link from 'next/link';
import { CONF_STATUS_LABELS } from '@/lib/types';
import { getApiErrorMessage } from '@/lib/errors';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useMyConferences, useSubmitConferenceForApproval } from '@/lib/queries';
import { useState } from 'react';

function MyConferencesContent() {
  const { data, isLoading } = useMyConferences();
  const submitApproval = useSubmitConferenceForApproval();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const conferences = data || [];

  const submitForApproval = async (id: number) => {
    setMessage('');
    setError('');
    try {
      await submitApproval.mutateAsync({ id });
      setMessage('Конференция отправлена на модерацию');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Не удалось отправить конференцию на модерацию'));
    }
  };

  return (
    <>
      <PageHeader
        title="Мои конференции"
        description="Управление мероприятиями, программой и сайтом"
        action={
          <Link href="/conferences/new">
            <Button>Создать конференцию</Button>
          </Link>
        }
        breadcrumbs={[{ label: 'Кабинет', href: '/dashboard' }, { label: 'Конференции' }]}
      />
      {message && <Alert variant="success" className="mb-4">{message}</Alert>}
      {error && <Alert variant="error" className="mb-4">{error}</Alert>}
      {isLoading ? (
        <LoadingSpinner />
      ) : conferences.length === 0 ? (
        <EmptyState
          title="Нет созданных конференций"
          description="Создайте первое мероприятие и откройте приём статей"
          actionLabel="Создать конференцию"
          actionHref="/conferences/new"
        />
      ) : (
        <ul className="space-y-4">
          {conferences.map((c) => (
            <li key={c.id}>
              <Card>
                <header className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-semibold">{c.title}</h2>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">
                    {CONF_STATUS_LABELS[c.status] || c.status}
                  </span>
                </header>
                <p className="mb-4 text-sm text-slate-600">{c.short_name}</p>
                {c.moderation_comment && (
                  <Alert variant={c.status === 'submission_open' ? 'info' : 'warning'} className="mb-4">
                    Комментарий модерации: {c.moderation_comment}
                  </Alert>
                )}
                <p className="mb-4 text-xs text-slate-500">{getModerationHint(c.status)}</p>
                <nav className="flex flex-wrap gap-2">
                  <Link href={`/conference-manage/${c.id}`}>
                    <Button variant="secondary">Управление</Button>
                  </Link>
                  <Link href={`/conferences/${c.id}/edit`}>
                    <Button variant="ghost">Редактировать</Button>
                  </Link>
                  <Link href={`/conference-program/${c.id}`}>
                    <Button variant="ghost">Программа</Button>
                  </Link>
                  <Link href={`/conference-site/${c.id}`}>
                    <Button variant="ghost">Сайт</Button>
                  </Link>
                  {(c.status === 'draft' || c.status === 'rejected') && (
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={submitApproval.isPending}
                      onClick={() => submitForApproval(c.id)}
                    >
                      Отправить на модерацию
                    </Button>
                  )}
                </nav>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function getModerationHint(status: string) {
  if (status === 'draft') return 'Заполните данные, сайт и программу, затем отправьте конференцию на модерацию.';
  if (status === 'pending_approval') return 'Конференция ожидает проверки администратором.';
  if (status === 'rejected') return 'Исправьте замечания администратора и отправьте конференцию повторно.';
  if (status === 'submission_open') return 'Конференция одобрена и открыта для участников.';
  return 'Управляйте этапами конференции из разделов программы, сайта и статей.';
}

export default function MyConferencesPage() {
  return (
    <RequireAuth roles={['organizer', 'admin']}>
      <MyConferencesContent />
    </RequireAuth>
  );
}
