'use client';

import Link from 'next/link';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { getUploadUrl } from '@/lib/api';
import { PAYMENT_STATUS_LABELS } from '@/lib/types';
import { useMyPapers } from '@/lib/queries';

function MyPapersContent() {
  const { data, isLoading } = useMyPapers();
  const papers = data || [];

  return (
    <>
      <PageHeader
        title="Мои статьи"
        description="Список поданных научных работ и их статусы"
        action={
          <Link href="/submit-paper">
            <Button>Новая статья</Button>
          </Link>
        }
        breadcrumbs={[{ label: 'Кабинет', href: '/dashboard' }, { label: 'Мои статьи' }]}
      />
      {isLoading ? (
        <LoadingSpinner />
      ) : papers.length === 0 ? (
        <EmptyState
          title="Статей пока нет"
          description="Создайте черновик и загрузите PDF для участия в конференции"
          actionLabel="Создать черновик"
          actionHref="/submit-paper"
        />
      ) : (
        <ul className="space-y-4">
          {papers.map((p) => (
            <li key={p.id}>
              <Card>
                <header className="mb-3 flex flex-wrap items-start justify-between gap-2">
                  <Link href={`/papers/${p.id}`} className="font-semibold text-brand-700 hover:underline">
                    {p.title}
                  </Link>
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge status={p.status} />
                    {p.payment_pending && (
                      <span className="inline-block rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                        {PAYMENT_STATUS_LABELS.pending}
                      </span>
                    )}
                  </div>
                </header>
                <p className="mb-4 line-clamp-2 text-sm text-slate-600">{p.abstract || 'Аннотация не заполнена'}</p>
                <nav className="flex flex-wrap gap-2">
                  <Link href={`/papers/${p.id}`} aria-label={`Открыть статью ${p.title}`}>
                    <Button variant="secondary">Открыть</Button>
                  </Link>
                  {(p.status === 'draft' || p.status === 'revision_required') && (
                    <Link href={`/submit-paper?paperId=${p.id}`} aria-label={`Редактировать статью ${p.title}`}>
                      <Button variant="ghost">Редактировать</Button>
                    </Link>
                  )}
                  {p.file_url && (
                    <a href={getUploadUrl(p.file_url) || '#'} target="_blank" rel="noopener noreferrer" aria-label={`Открыть PDF статьи ${p.title}`}>
                      <Button variant="ghost">PDF</Button>
                    </a>
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

export default function MyPapersPage() {
  return (
    <RequireAuth>
      <MyPapersContent />
    </RequireAuth>
  );
}
