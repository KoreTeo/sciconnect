'use client';

import { useState } from 'react';
import type { PaperAuthor, User } from '@/lib/types';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useUserSearch } from '@/hooks/useUserSearch';

export function CoAuthorsEditor({
  value,
  onChange,
  disabled,
}: {
  value: PaperAuthor[];
  onChange: (authors: PaperAuthor[]) => void;
  disabled?: boolean;
}) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [manualName, setManualName] = useState('');
  const [manualAffiliation, setManualAffiliation] = useState('');
  const [manualOrcid, setManualOrcid] = useState('');
  const searchQuery = useUserSearch(submitted);

  const search = () => {
    if (email.length < 3) return;
    setSubmitted(email.trim());
  };

  const searchUsers = searchQuery.data || [];

  const addUser = (u: User) => {
    if (value.some((a) => a.user_id === u.id)) return;
    onChange([
      ...value,
      {
        user_id: u.id,
        full_name: u.full_name,
        affiliation: u.affiliation,
        orcid: u.orcid,
        order: value.length + 1,
        is_corresponding: false,
      },
    ]);
    setEmail('');
    setSubmitted('');
  };

  const addManual = () => {
    if (!manualName.trim()) return;
    onChange([
      ...value,
      {
        full_name: manualName.trim(),
        affiliation: manualAffiliation.trim() || undefined,
        orcid: manualOrcid.trim() || undefined,
        order: value.length + 1,
        is_corresponding: false,
      },
    ]);
    setManualName('');
    setManualAffiliation('');
    setManualOrcid('');
  };

  const remove = (index: number) => {
    onChange(value.filter((_, i) => i !== index).map((a, i) => ({ ...a, order: i + 1 })));
  };

  const searchStatus = searchQuery.isFetching
    ? 'Поиск соавторов...'
    : submitted.length >= 3 && !searchQuery.isFetching
      ? searchUsers.length === 0
        ? 'Пользователи не найдены'
        : `Найдено пользователей: ${searchUsers.length}`
      : '';

  return (
    <fieldset className="space-y-3" disabled={disabled}>
      <legend className="text-sm font-medium text-slate-700">Соавторы</legend>
      {value.length > 0 && (
        <ul className="space-y-2 text-sm">
          {value.map((a, i) => (
            <li key={i} className="flex items-center justify-between rounded border px-3 py-2">
              <span>
                {a.full_name}
                {a.affiliation ? ` · ${a.affiliation}` : ''}
                {a.orcid ? ` · ORCID ${a.orcid}` : ''}
              </span>
              {!disabled && (
                <Button type="button" variant="ghost" aria-label={`Удалить соавтора ${a.full_name}`} onClick={() => remove(i)}>
                  Удалить
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
      {!disabled && (
        <>
          <div className="flex flex-wrap gap-2">
            <Input
              label="Поиск зарегистрированного соавтора"
              placeholder="Email соавтора (мин. 3 символа)"
              hint="Введите минимум 3 символа email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button type="button" variant="secondary" onClick={search} aria-label="Найти зарегистрированного соавтора по email">
              Найти
            </Button>
          </div>
          {searchStatus && (
            <p className="text-xs text-slate-500" role="status" aria-live="polite">
              {searchStatus}
            </p>
          )}
          {searchUsers.length > 0 && (
            <ul className="space-y-1 rounded border p-2 text-sm">
              {searchUsers.map((u) => (
                <li key={u.id} className="flex justify-between">
                  <span>
                    {u.full_name} ({u.email})
                  </span>
                  <Button type="button" variant="ghost" aria-label={`Добавить соавтора ${u.full_name}`} onClick={() => addUser(u)}>
                    Добавить
                  </Button>
                </li>
              ))}
            </ul>
          )}
          <div className="grid gap-2 sm:grid-cols-2">
            <Input
              label="Имя внешнего соавтора"
              placeholder="Имя (внешний соавтор)"
              value={manualName}
              onChange={(e) => setManualName(e.target.value)}
            />
            <Input
              label="Аффилиация внешнего соавтора"
              placeholder="Аффилиация"
              value={manualAffiliation}
              onChange={(e) => setManualAffiliation(e.target.value)}
            />
            <Input
              label="ORCID"
              placeholder="0000-0002-1825-0097"
              value={manualOrcid}
              onChange={(e) => setManualOrcid(e.target.value)}
            />
          </div>
          <Button type="button" variant="secondary" onClick={addManual}>
            Добавить вручную
          </Button>
        </>
      )}
    </fieldset>
  );
}
