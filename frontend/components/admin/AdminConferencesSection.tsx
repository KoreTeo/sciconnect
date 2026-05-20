'use client';

import type { Conference } from '@/lib/types';
import { CONF_STATUS_LABELS } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';

type Props = {
  conferences: Conference[];
  search: string;
  status: string;
  skip: number;
  isMutating: boolean;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onSkipChange: (skip: number) => void;
  onUpdateConference: (id: number, patch: { status: string }) => Promise<void>;
};

export function AdminConferencesSection({
  conferences,
  search,
  status,
  skip,
  isMutating,
  onSearchChange,
  onStatusChange,
  onSkipChange,
  onUpdateConference,
}: Props) {
  return (
    <section className="mb-8">
      <h2 className="mb-4 text-lg font-semibold">Конференции</h2>
      <div className="mb-4 flex flex-wrap gap-2">
        <Input
          className="max-w-xs"
          label="Поиск конференции"
          placeholder="Поиск конференции..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <Select
          className="max-w-[220px]"
          value={status}
          aria-label="Статус конференции"
          onChange={(e) => onStatusChange(e.target.value)}
        >
          <option value="">Все статусы</option>
          {Object.entries(CONF_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <Button variant="ghost" disabled={skip === 0} onClick={() => onSkipChange(Math.max(0, skip - 50))}>
          ← Назад
        </Button>
        <Button variant="ghost" disabled={conferences.length < 50} onClick={() => onSkipChange(skip + 50)}>
          Вперёд →
        </Button>
      </div>
      <Card>
        {conferences.length === 0 ? (
          <EmptyState title="Конференции не найдены" description="Измените поиск или фильтр статуса" />
        ) : (
          <ul className="divide-y divide-slate-200">
            {conferences.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                <div>
                  <p className="font-medium">{c.title}</p>
                  <p className="text-xs text-slate-500">
                    ID {c.id}
                    {c.short_name ? ` · /c/${c.short_name}` : ''}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <a href={`/conference-manage/${c.id}`} className="text-brand-600 hover:underline" aria-label={`Управление конференцией ${c.title}`}>
                    Управление
                  </a>
                  {c.short_name && (
                    <a
                      href={`/c/${c.short_name}`}
                      className="text-brand-600 hover:underline"
                      target="_blank"
                      aria-label={`Открыть публичный сайт конференции ${c.title}`}
                    >
                      Сайт
                    </a>
                  )}
                  <Select
                    value={c.status}
                    aria-label={`Статус конференции ${c.title}`}
                    className="max-w-[200px]"
                    disabled={isMutating}
                    onChange={(e) => onUpdateConference(c.id, { status: e.target.value })}
                  >
                    {Object.entries(CONF_STATUS_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </Select>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </section>
  );
}
