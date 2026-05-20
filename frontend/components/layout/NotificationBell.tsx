'use client';

import { useEffect, useState, useRef, useId } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Notification } from '@/lib/types';
import { formatRelativeTime } from '@/lib/format';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadNotificationCount,
} from '@/lib/queries';

export function NotificationBell() {
  const router = useRouter();
  const notificationsQuery = useNotifications({ limit: 20 });
  const unreadQuery = useUnreadNotificationCount();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const items = notificationsQuery.data || [];
  const unread = unreadQuery.data ?? items.filter((n) => !n.is_read).length;
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const menuId = useId();

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => {
      listRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
    });
  }, [open]);

  const openItem = async (n: Notification) => {
    if (!n.is_read) await markRead.mutateAsync(n.id);
    setOpen(false);
    if (n.link) router.push(n.link);
  };

  return (
    <div ref={ref} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
        aria-label={unread > 0 ? `Уведомления, непрочитанных: ${unread}` : 'Уведомления'}
        aria-expanded={open}
        aria-controls={menuId}
        aria-haspopup="menu"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      {open && (
        <div
          id={menuId}
          className="fixed right-4 top-[4.25rem] z-50 w-[min(20rem,calc(100vw-2rem))] rounded-lg border border-slate-200 bg-white shadow-lg sm:absolute sm:right-0 sm:top-full sm:mt-2 sm:w-80"
        >
          <div className="flex items-center justify-between border-b px-3 py-2">
            <span className="text-sm font-semibold">Уведомления</span>
            {unread > 0 && (
              <button
                type="button"
                className="text-xs text-brand-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
                disabled={markAllRead.isPending}
                onClick={() => markAllRead.mutate()}
              >
                Прочитать все
              </button>
            )}
          </div>
          <ul ref={listRef} className="max-h-72 overflow-y-auto" aria-label="Список уведомлений">
            {notificationsQuery.isLoading ? (
              <li className="px-3 py-4 text-center text-sm text-slate-500">Загрузка...</li>
            ) : items.length === 0 ? (
              <li className="px-3 py-4 text-center text-sm text-slate-500">Нет уведомлений</li>
            ) : (
              items.map((n) => (
                <li key={n.id} className={`border-b text-sm last:border-0 ${!n.is_read ? 'bg-brand-50/50' : ''}`}>
                  <button
                    type="button"
                    className="block w-full px-3 py-2 text-left hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-inset"
                    onClick={() => openItem(n)}
                    aria-label={`${n.is_read ? '' : 'Непрочитано: '}${n.title}. ${n.message}`}
                  >
                    <span className="block font-medium">{n.title}</span>
                    <span className="block text-slate-600 line-clamp-2">{n.message}</span>
                    <span className="mt-0.5 block text-xs text-slate-400">{formatRelativeTime(n.created_at)}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
          <div className="border-t px-3 py-2 text-center">
            <Link
              href="/notifications"
              className="text-xs font-medium text-brand-600 hover:underline"
              onClick={() => setOpen(false)}
            >
              Все уведомления →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
