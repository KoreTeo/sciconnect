'use client';

import { CONF_STATUS_LABELS, ROLE_LABELS } from '@/lib/types';
import { useAdminSummary } from '@/lib/queries';
import { Card } from '@/components/ui/Card';
import { MetricCard, MetricList } from '@/components/ui/MetricCard';

type Props = {
  summary?: NonNullable<ReturnType<typeof useAdminSummary>['data']>;
  loading: boolean;
};

export function AdminMetrics({ summary, loading }: Props) {
  return (
    <>
      <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Пользователи" value={summary?.users_total} loading={loading} />
        <MetricCard label="Активные" value={summary?.users_active} loading={loading} />
        <MetricCard label="Заблокированы" value={summary?.users_blocked} loading={loading} />
        <MetricCard label="Конференции" value={summary?.conferences_total} loading={loading} />
      </section>

      <section className="mb-8 grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-semibold">Пользователи по ролям</h2>
          <MetricList items={ROLE_LABELS} values={summary?.users_by_role} />
        </Card>
        <Card>
          <h2 className="mb-3 font-semibold">Конференции по статусам</h2>
          <MetricList items={CONF_STATUS_LABELS} values={summary?.conferences_by_status} />
        </Card>
      </section>
    </>
  );
}
