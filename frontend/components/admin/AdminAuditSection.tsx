'use client';

import type { AdminAuditLog } from '@/lib/types';
import { formatDateTime } from '@/lib/format';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { ADMIN_ACTION_LABELS, ADMIN_ENTITY_LABELS, formatAuditPayload } from '@/components/admin/adminAuditLabels';

type Props = {
  entries: AdminAuditLog[];
  loading: boolean;
  entityType: string;
  onEntityTypeChange: (value: string) => void;
};

export function AdminAuditSection({ entries, loading, entityType, onEntityTypeChange }: Props) {
  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Последние действия</h2>
        <Select
          className="max-w-[220px]"
          value={entityType}
          aria-label="Тип сущности в журнале"
          onChange={(e) => onEntityTypeChange(e.target.value)}
        >
          <option value="">Все действия</option>
          <option value="user">Пользователи</option>
          <option value="conference">Конференции</option>
        </Select>
      </div>
      <Card>
        {loading ? (
          <p className="text-sm text-slate-500">Загрузка журнала...</p>
        ) : entries.length === 0 ? (
          <EmptyState title="Действий пока нет" description="Изменения ролей, блокировок и статусов появятся здесь" />
        ) : (
          <ul className="divide-y divide-slate-200">
            {entries.map((entry) => (
              <li key={entry.id} className="py-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">
                    {ADMIN_ACTION_LABELS[entry.action] || entry.action}
                    {' · '}
                    {ADMIN_ENTITY_LABELS[entry.entity_type] || entry.entity_type} #{entry.entity_id}
                  </p>
                  <p className="text-xs text-slate-500">{formatDateTime(entry.created_at)}</p>
                </div>
                <p className="mt-1 text-xs text-slate-500">{entry.actor_email || `Администратор #${entry.actor_id}`}</p>
                <p className="mt-2 rounded bg-slate-50 px-2 py-1 text-xs text-slate-600">
                  Было: {formatAuditPayload(entry.before)} → Стало: {formatAuditPayload(entry.after)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </section>
  );
}
