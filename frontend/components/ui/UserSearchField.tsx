'use client';

import { useState } from 'react';
import api from '@/lib/api';
import type { User } from '@/lib/types';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useUserSearch } from '@/hooks/useUserSearch';

interface UserSearchFieldProps {
  label?: string;
  placeholder?: string;
  minLength?: number;
  onSelect: (user: User) => void;
  renderAction?: (user: User) => React.ReactNode;
}

export function UserSearchField({
  label = 'Email',
  placeholder = 'Email (мин. 3 символа)',
  minLength = 3,
  onSelect,
  renderAction,
}: UserSearchFieldProps) {
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState('');
  const searchQuery = useUserSearch(submitted, minLength);

  const search = () => {
    if (query.trim().length < minLength) return;
    setSubmitted(query.trim());
  };

  const users = searchQuery.data || [];

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input label={label} placeholder={placeholder} value={query} onChange={(e) => setQuery(e.target.value)} />
        <Button type="button" className="self-end" onClick={search} disabled={query.trim().length < minLength}>
          Найти
        </Button>
      </div>
      {searchQuery.isFetching && <p className="text-sm text-slate-500">Поиск...</p>}
      {submitted.length >= minLength && !searchQuery.isFetching && users.length === 0 && (
        <p className="text-sm text-slate-500">Пользователи не найдены</p>
      )}
      <ul className="space-y-2">
        {users.map((u) => (
          <li key={u.id} className="flex justify-between rounded border p-2 text-sm">
            <span>
              {u.full_name} ({u.email})
            </span>
            {renderAction ? (
              renderAction(u)
            ) : (
              <Button variant="secondary" onClick={() => onSelect(u)}>
                Выбрать
              </Button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
