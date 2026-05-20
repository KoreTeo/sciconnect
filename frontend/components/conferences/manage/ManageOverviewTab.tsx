'use client';

import Link from 'next/link';
import { STATUS_LABELS, type Conference, type ConferenceAnalytics, type Paper, type PaperStatus } from '@/lib/types';
import { formatDateTime } from '@/lib/format';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

type Props = {
  conference: Conference;
  conferenceId: string;
  papers: Paper[];
  registrationsCount: number;
  analytics?: ConferenceAnalytics;
  analyticsLoading?: boolean;
};

export function ManageOverviewTab({
  conference,
  conferenceId,
  papers,
  registrationsCount,
  analytics,
  analyticsLoading,
}: Props) {
  const maxSubmission = Math.max(1, ...(analytics?.submissions_by_day.map((d) => d.count) ?? [1]));
  const reviewTotal = analytics?.reviewer_assigned ?? 0;
  const reviewDone = analytics?.reviewer_completed ?? 0;
  const reviewPct = reviewTotal > 0 ? Math.round((reviewDone / reviewTotal) * 100) : 0;
  const statuses: PaperStatus[] = ['draft', 'submitted', 'under_review', 'accepted', 'rejected', 'revision_required'];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statuses.map((st) => (
          <article key={st} className="stat-card">
            <p className="text-sm text-slate-500">{STATUS_LABELS[st] || st}</p>
            <p className="text-2xl font-bold">
              {analytics?.status_breakdown[st] ?? papers.filter((p) => p.status === st).length}
            </p>
          </article>
        ))}
        <Card className="sm:col-span-2">
          <p>
            <strong>Дедлайн подачи:</strong> {formatDateTime(conference.submission_deadline)}
          </p>
          <p>
            <strong>Дедлайн рецензий:</strong> {formatDateTime(conference.review_deadline)}
          </p>
          <p>
            <strong>Регистраций:</strong> {analytics?.registrations_count ?? registrationsCount}
          </p>
          <p>
            <strong>Статей всего:</strong> {analytics?.papers_count ?? papers.length}
          </p>
          <nav className="mt-4 flex flex-wrap gap-2">
            <Link href={`/conferences/${conferenceId}/edit`}>
              <Button variant="secondary">Редактировать</Button>
            </Link>
            <Link href={`/conference-proceedings/${conferenceId}`}>
              <Button variant="secondary">Сборник</Button>
            </Link>
            <Link href={`/conference-site/${conferenceId}`}>
              <Button variant="secondary">Сайт</Button>
            </Link>
          </nav>
        </Card>
      </div>
      {analyticsLoading && <p className="text-sm text-slate-500">Загрузка аналитики...</p>}
      {analytics && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <h3 className="mb-3 font-semibold">Подачи за 30 дней</h3>
            {analytics.submissions_by_day.length === 0 ? (
              <p className="text-sm text-slate-500">Нет поданных статей за период</p>
            ) : (
              <ul className="space-y-2">
                {analytics.submissions_by_day.map((d) => (
                  <li key={d.date} className="flex items-center gap-3 text-sm">
                    <span className="w-24 shrink-0 text-slate-500">{d.date}</span>
                    <div className="h-3 flex-1 rounded bg-slate-100">
                      <div
                        className="h-3 rounded bg-brand-500"
                        style={{ width: `${Math.round((d.count / maxSubmission) * 100)}%` }}
                      />
                    </div>
                    <span className="w-8 text-right font-medium">{d.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card>
            <h3 className="mb-3 font-semibold">Рецензирование</h3>
            <p className="mb-2 text-sm text-slate-600">
              Завершено: {reviewDone} из {reviewTotal} ({reviewPct}%)
            </p>
            <div className="h-4 rounded bg-slate-100">
              <div className="h-4 rounded bg-emerald-500" style={{ width: `${reviewPct}%` }} />
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
