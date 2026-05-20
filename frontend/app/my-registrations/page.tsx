'use client';

import Link from 'next/link';
import { REGISTRATION_TYPE_LABELS, REGISTRATION_STATUS_LABELS, PAYMENT_STATUS_LABELS } from '@/lib/types';
import { formatDateTime } from '@/lib/format';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useMyRegistrations } from '@/lib/queries';

function conferenceHref(r: { conference_id: number; short_name?: string }) {
  return r.short_name ? `/c/${r.short_name}` : `/conferences/${r.conference_id}`;
}

function MyRegistrationsContent() {
  const { data: items = [], isLoading } = useMyRegistrations();

  if (isLoading) return <LoadingSpinner />;

  return (
    <>
      <PageHeader title="Мои регистрации" description="Участие в конференциях без подачи статьи" />
      {items.length === 0 ? (
        <EmptyState
          title="Регистраций пока нет"
          description="Зарегистрируйтесь на конференцию из каталога или публичного сайта"
          actionLabel="Каталог"
          actionHref="/conferences"
        />
      ) : (
        <ul className="space-y-4">
          {items.map((r) => (
            <li key={r.id}>
              <Card className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium">{r.conference_title || `Конференция #${r.conference_id}`}</p>
                  <p className="text-sm text-slate-500">
                    {REGISTRATION_TYPE_LABELS[r.registration_type] || r.registration_type}
                    {' · '}
                    {REGISTRATION_STATUS_LABELS[r.status] || r.status}
                    {' · '}
                    {formatDateTime(r.registered_at)}
                  </p>
                  {r.status === 'pending' && (
                    <span className="mt-1 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                      {PAYMENT_STATUS_LABELS.pending}
                    </span>
                  )}
                </div>
                <Link
                  href={conferenceHref(r)}
                  className="text-sm text-brand-600 hover:underline"
                  aria-label={`Открыть ${r.conference_title || 'конференцию'}`}
                >
                  Открыть →
                </Link>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export default function MyRegistrationsPage() {
  return (
    <RequireAuth>
      <MyRegistrationsContent />
    </RequireAuth>
  );
}
