'use client';

import type { User } from '@/lib/types';
import { ROLE_LABELS } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Table } from '@/components/ui/Table';
import { EmptyState } from '@/components/ui/EmptyState';

type Props = {
  users: User[];
  search: string;
  role: string;
  activeFilter: string;
  skip: number;
  isMutating: boolean;
  onSearchChange: (value: string) => void;
  onRoleChange: (value: string) => void;
  onActiveFilterChange: (value: string) => void;
  onSkipChange: (skip: number) => void;
  onUpdateUser: (id: number, patch: { role?: string; is_active?: boolean }) => Promise<void>;
};

export function AdminUsersSection({
  users,
  search,
  role,
  activeFilter,
  skip,
  isMutating,
  onSearchChange,
  onRoleChange,
  onActiveFilterChange,
  onSkipChange,
  onUpdateUser,
}: Props) {
  return (
    <section className="mb-8">
      <h2 className="mb-4 text-lg font-semibold">Пользователи</h2>
      <div className="mb-4 flex flex-wrap gap-2">
        <Input
          className="max-w-xs"
          label="Поиск пользователей"
          placeholder="Поиск по email или имени..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <Select className="max-w-[180px]" value={role} aria-label="Роль пользователя" onChange={(e) => onRoleChange(e.target.value)}>
          <option value="">Все роли</option>
          {Object.entries(ROLE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <Select
          className="max-w-[180px]"
          value={activeFilter}
          aria-label="Активность пользователя"
          onChange={(e) => onActiveFilterChange(e.target.value)}
        >
          <option value="">Все статусы</option>
          <option value="active">Активные</option>
          <option value="blocked">Заблокированные</option>
        </Select>
        <Button variant="ghost" disabled={skip === 0} onClick={() => onSkipChange(Math.max(0, skip - 50))}>
          ← Назад
        </Button>
        <Button variant="ghost" disabled={users.length < 50} onClick={() => onSkipChange(skip + 50)}>
          Вперёд →
        </Button>
      </div>
      <Card>
        {users.length === 0 ? (
          <EmptyState title="Пользователи не найдены" description="Измените поиск или фильтры" />
        ) : (
          <Table caption="Пользователи админ-панели" headers={['Email', 'Имя', 'Роль', 'Активен']}>
            {users.map((u) => (
              <tr key={u.id} className="border-b">
                <td className="p-2">
                  <p className="font-medium">{u.email}</p>
                  <p className="text-xs text-slate-500">ID {u.id}</p>
                </td>
                <td className="p-2">{u.full_name}</td>
                <td className="p-2">
                  <Select
                    value={u.role}
                    aria-label={`Роль пользователя ${u.email}`}
                    disabled={isMutating}
                    onChange={(e) => onUpdateUser(u.id, { role: e.target.value })}
                  >
                    {Object.entries(ROLE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </Select>
                </td>
                <td className="p-2">
                  <Button
                    variant={u.is_active ? 'ghost' : 'secondary'}
                    aria-label={u.is_active ? `Заблокировать пользователя ${u.email}` : `Активировать пользователя ${u.email}`}
                    disabled={isMutating}
                    onClick={() => onUpdateUser(u.id, { is_active: !u.is_active })}
                  >
                    {u.is_active ? 'активен' : 'заблокирован'}
                  </Button>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </section>
  );
}
