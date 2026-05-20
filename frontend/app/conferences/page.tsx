'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import Link from 'next/link';
import { CONF_STATUS_LABELS, FORMAT_LABELS } from '@/lib/types';
import { formatDateRange, formatDateShort } from '@/lib/format';
import { PageHeader } from '@/components/ui/PageHeader';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useConferences } from '@/lib/queries';

export default function ConferencesPage() {
  const [search, setSearch] = useState('');
  const [format, setFormat] = useState('');
  const [page, setPage] = useState(0);
  const deferredSearch = useDeferredValue(search);
  const pageSize = 50;
  const filters = useMemo(
    () => ({
      ...(deferredSearch ? { search: deferredSearch } : {}),
      ...(format ? { format } : {}),
      skip: page * pageSize,
      limit: pageSize,
    }),
    [deferredSearch, format, page]
  );
  const { data = [], isLoading } = useConferences(filters);
  const conferences = data.filter((c) => c.short_name);

  return (
    <>
      <PageHeader
        title="Каталог конференций"
        description="Выберите мероприятие — откроется его публичный сайт"
      />
      <div className="mb-6 flex flex-wrap gap-4">
        <div className="min-w-[200px] flex-1">
          <Input
            label="Поиск конференций"
            placeholder="Поиск по названию..."
            value={search}
            onChange={(e) => {
              setPage(0);
              setSearch(e.target.value);
            }}
          />
        </div>
        <select
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          value={format}
          onChange={(e) => {
            setPage(0);
            setFormat(e.target.value);
          }}
          aria-label="Формат проведения"
        >
          <option value="">Все форматы</option>
          <option value="offline">Очно</option>
          <option value="online">Онлайн</option>
          <option value="hybrid">Гибрид</option>
        </select>
      </div>
      {isLoading ? (
        <LoadingSpinner />
      ) : conferences.length === 0 ? (
        <EmptyState
          title="Конференции не найдены"
          description="Нет опубликованных сайтов по вашему запросу. Попробуйте изменить фильтры."
        />
      ) : (
        <ul className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {conferences.map((c) => (
            <li key={c.id}>
              <Link
                href={`/c/${c.short_name}`}
                className="block px-5 py-4 transition hover:bg-brand-50/60"
              >
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold text-brand-700">{c.title}</h2>
                  <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-700">
                    {FORMAT_LABELS[c.format] || c.format}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                    {CONF_STATUS_LABELS[c.status] || c.status}
                  </span>
                </div>
                {c.description && (
                  <p className="mb-2 line-clamp-2 text-sm text-slate-600">{c.description}</p>
                )}
                <p className="text-sm text-slate-500">
                  {formatDateRange(c.start_date, c.end_date)}
                  {c.location ? ` · ${c.location}` : ''}
                </p>
                <p className="mt-1 text-xs text-amber-800">
                  Дедлайн подачи статей: {formatDateShort(c.submission_deadline)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-4 flex gap-2">
        <p className="self-center text-sm text-slate-500" aria-live="polite">Страница {page + 1}</p>
        <button
          type="button"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:opacity-50"
          disabled={page === 0}
          aria-label="Предыдущая страница конференций"
          onClick={() => setPage((current) => Math.max(0, current - 1))}
        >
          Назад
        </button>
        <button
          type="button"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:opacity-50"
          disabled={data.length < pageSize}
          aria-label="Следующая страница конференций"
          onClick={() => setPage((current) => current + 1)}
        >
          Вперёд
        </button>
      </div>
    </>
  );
}
