'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/lib/auth';
import type { Conference } from '@/lib/types';
import { isConferenceOwner } from '@/lib/permissions';
import { formatDateShort } from '@/lib/format';
import { useConference, useConferences } from '@/lib/queries';

export function ConferencePicker({
  value,
  onChange,
  disabled,
  onlyOpen = true,
}: {
  value: string;
  onChange: (conferenceId: string, conference: Conference | null) => void;
  disabled?: boolean;
  onlyOpen?: boolean;
}) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inputId = useId();
  const listId = useId();
  const statusId = useId();
  const { user } = useAuth();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 250);
    return () => clearTimeout(t);
  }, [query]);

  const selectedQuery = useConference(value || undefined);

  const searchFilters = useMemo(
    () => ({
      status: onlyOpen ? 'submission_open' : undefined,
      search: debouncedQuery.length >= 2 ? debouncedQuery : undefined,
    }),
    [debouncedQuery, onlyOpen]
  );

  const searchQuery = useConferences(searchFilters);

  const options = useMemo(() => {
    const list = searchQuery.data || [];
    return list.filter((c) => !user || !isConferenceOwner(user, c));
  }, [searchQuery.data, user]);

  const selected = selectedQuery.data || null;

  useEffect(() => {
    if (selected) setQuery(selected.title);
  }, [selected?.id, selected?.title]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  const pick = (c: Conference) => {
    setQuery(c.title);
    onChange(String(c.id), c);
    setOpen(false);
  };

  const loading = searchQuery.isFetching;

  return (
    <div ref={ref} className="relative">
      <label htmlFor={inputId} className="mb-1 block text-sm font-medium text-slate-700">
        Конференция <span className="text-red-600" aria-hidden="true">*</span>
      </label>
      <input
        id={inputId}
        type="text"
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:bg-slate-50"
        placeholder="Начните вводить название..."
        value={query}
        disabled={disabled}
        required
        aria-required="true"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && options[activeIndex] ? `${listId}-${options[activeIndex].id}` : undefined}
        aria-describedby={statusId}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          if (!e.target.value) {
            onChange('', null);
          }
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            setOpen(false);
            return;
          }
          if (!open || options.length === 0) return;
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActiveIndex((current) => (current + 1) % options.length);
          } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActiveIndex((current) => (current - 1 + options.length) % options.length);
          } else if (event.key === 'Enter') {
            event.preventDefault();
            pick(options[activeIndex]);
          }
        }}
        autoComplete="off"
      />
      {selected && (
        <p className="mt-1 text-xs text-slate-500">
          {selected.short_name && `/${selected.short_name} · `}
          дедлайн подачи: {formatDateShort(selected.submission_deadline)}
        </p>
      )}
      <p id={statusId} className="sr-only" role="status" aria-live="polite">
        {loading ? 'Загрузка конференций' : open ? `Найдено конференций: ${options.length}` : ''}
      </p>
      {open && !disabled && options.length > 0 && (
        <ul id={listId} role="listbox" className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
          {options.map((c, index) => (
            <li key={c.id} id={`${listId}-${c.id}`} role="option" aria-selected={index === activeIndex}>
              <button
                type="button"
                className={`w-full px-3 py-2 text-left text-sm hover:bg-brand-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-inset ${index === activeIndex ? 'bg-brand-50' : ''}`}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => pick(c)}
              >
                <span className="font-medium">{c.title}</span>
                <span className="mt-0.5 block text-xs text-slate-500">
                  {c.location || '—'} · до {formatDateShort(c.submission_deadline)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {open && !disabled && debouncedQuery.length >= 2 && options.length === 0 && !loading && (
        <p className="absolute z-20 mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-500 shadow">
          Конференции не найдены
        </p>
      )}
    </div>
  );
}
