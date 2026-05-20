'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CONF_STATUS_LABELS, FORMAT_LABELS } from '@/lib/types';
import { formatDateTime, formatDateRange } from '@/lib/format';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { canManageConference } from '@/lib/permissions';
import { useConference } from '@/lib/queries';

export default function ConferenceDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { data: conf, isLoading } = useConference(id as string);

  useEffect(() => {
    if (authLoading || !conf?.short_name) return;
    const isManager = user && canManageConference(user, conf);
    if (!isManager) {
      router.replace(`/c/${conf.short_name}`);
    }
  }, [authLoading, conf, user, router]);

  if (!conf || authLoading || isLoading) return <LoadingSpinner />;

  const isManager = user && canManageConference(user, conf);
  if (conf.short_name && !isManager) return <LoadingSpinner />;

  const isOwner = canManageConference(user, conf);

  return (
    <article>
      <PageHeader
        title={conf.title}
        description={CONF_STATUS_LABELS[conf.status] || conf.status}
        breadcrumbs={[{ label: 'Каталог', href: '/conferences' }, { label: conf.title.slice(0, 40) }]}
        action={
          isOwner ? (
            <div className="flex flex-wrap gap-2">
              <Link href={`/conference-manage/${conf.id}`}>
                <Button variant="secondary">Управление</Button>
              </Link>
              <Link href={`/conferences/${conf.id}/edit`}>
                <Button variant="secondary">Редактировать</Button>
              </Link>
              <Link href={`/conference-site/${conf.id}`}>
                <Button>Конструктор сайта</Button>
              </Link>
            </div>
          ) : undefined
        }
      />
      {conf.short_name && (
        <p className="mb-4">
          <Link href={`/c/${conf.short_name}`} className="text-brand-600 hover:underline" target="_blank">
            Публичный сайт →
          </Link>
        </p>
      )}
      <Card className="mb-6">
        <div className="mb-4 flex gap-2">
          <span className="inline-block rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-800">
            {CONF_STATUS_LABELS[conf.status] || conf.status}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs">{FORMAT_LABELS[conf.format] || conf.format}</span>
        </div>
        <p className="mb-4 text-slate-700">{conf.description}</p>
        <ul className="space-y-2 text-sm text-slate-600">
          <li><strong>Даты:</strong> {formatDateRange(conf.start_date, conf.end_date)}</li>
          <li><strong>Место:</strong> {conf.location || '—'}</li>
          <li><strong>Дедлайн подачи:</strong> {formatDateTime(conf.submission_deadline)}</li>
          <li><strong>Дедлайн рецензий:</strong> {formatDateTime(conf.review_deadline)}</li>
        </ul>
        {conf.topics && conf.topics.length > 0 && (
          <p className="mt-4 flex flex-wrap gap-2">
            {conf.topics.map((t) => (
              <span key={t} className="rounded-full bg-brand-50 px-3 py-1 text-xs text-brand-700">{t}</span>
            ))}
          </p>
        )}
      </Card>
    </article>
  );
}
