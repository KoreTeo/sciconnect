'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatRelativeTime } from '@/lib/format';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationsInfinite,
} from '@/lib/queries';

type Filter = 'all' | 'unread';

function NotificationsContent() {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>('all');
  const isUnreadOnly = filter === 'unread';
  const listQuery = useNotificationsInfinite(isUnreadOnly ? { is_read: false } : undefined);
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const items = listQuery.data?.pages.flat() ?? [];

  const openItem = async (id: number, link?: string, isRead?: boolean) => {
    if (!isRead) await markRead.mutateAsync(id);
    if (link) router.push(link);
  };

  const grouped = items.reduce<Record<string, typeof items>>((acc, n) => {
    const day = n.created_at.slice(0, 10);
    if (!acc[day]) acc[day] = [];
    acc[day].push(n);
    return acc;
  }, {});

  return (
    <>
      <PageHeader
        title="Уведомления"
        description="История событий по статьям, рецензиям и конференциям"
        breadcrumbs={[{ label: 'Кабинет', href: '/dashboard' }, { label: 'Уведомления' }]}
        action={
          items.some((n) => !n.is_read) ? (
            <Button
              type="button"
              variant="secondary"
              disabled={markAllRead.isPending}
              onClick={() => markAllRead.mutate()}
            >
              Отметить все прочитанными
            </Button>
          ) : undefined
        }
      />
      <div className="mb-4 flex gap-2">
        <Button
          type="button"
          variant={filter === 'all' ? 'primary' : 'secondary'}
          onClick={() => setFilter('all')}
        >
          Все
        </Button>
        <Button
          type="button"
          variant={filter === 'unread' ? 'primary' : 'secondary'}
          onClick={() => setFilter('unread')}
        >
          Непрочитанные
        </Button>
      </div>
      {listQuery.isLoading ? (
        <LoadingSpinner />
      ) : items.length === 0 ? (
        <EmptyState
          title={isUnreadOnly ? 'Нет непрочитанных' : 'Уведомлений пока нет'}
          description="Здесь появятся события по вашим статьям и конференциям"
        />
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped)
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([day, dayItems]) => (
              <section key={day}>
                <h2 className="mb-2 text-sm font-medium text-slate-500">{day}</h2>
                <ul className="space-y-2">
                  {dayItems.map((n) => (
                    <li key={n.id}>
                      <Card
                        className={`cursor-pointer transition hover:border-brand-300 ${!n.is_read ? 'border-brand-200 bg-brand-50/30' : ''}`}
                      >
                        <button
                          type="button"
                          className="block w-full text-left"
                          onClick={() => openItem(n.id, n.link, n.is_read)}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <p className="font-medium">{n.title}</p>
                            <time className="text-xs text-slate-500" dateTime={n.created_at}>
                              {formatRelativeTime(n.created_at)}
                            </time>
                          </div>
                          <p className="mt-1 text-sm text-slate-600">{n.message}</p>
                          {n.link && <p className="mt-2 text-xs text-brand-600">Открыть →</p>}
                        </button>
                      </Card>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          {listQuery.hasNextPage && (
            <div className="text-center">
              <Button
                type="button"
                variant="secondary"
                disabled={listQuery.isFetchingNextPage}
                onClick={() => listQuery.fetchNextPage()}
              >
                {listQuery.isFetchingNextPage ? 'Загрузка...' : 'Загрузить ещё'}
              </Button>
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default function NotificationsPage() {
  return (
    <RequireAuth>
      <NotificationsContent />
    </RequireAuth>
  );
}
