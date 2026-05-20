'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { ROLE_LABELS } from '@/lib/types';
import { StatusBadge } from '@/components/ui/Badge';
import { useDashboardStats, useMyConferences, useMyPapers } from '@/lib/queries';

const LINKS = [
  { href: '/my-papers', title: 'Мои статьи', desc: 'Поданные работы и статусы', roles: ['user', 'reviewer', 'organizer', 'admin'] },
  { href: '/my-registrations', title: 'Мои регистрации', desc: 'Участие в конференциях', roles: ['user', 'reviewer', 'organizer', 'admin'] },
  { href: '/notifications', title: 'Уведомления', desc: 'История событий и оповещений', roles: ['user', 'reviewer', 'organizer', 'admin'] },
  { href: '/conferences', title: 'Каталог', desc: 'Поиск конференций', roles: ['user', 'reviewer', 'organizer', 'admin'] },
  { href: '/reviews', title: 'Рецензии', desc: 'Назначенные рецензии', roles: ['reviewer', 'organizer', 'admin'] },
  { href: '/my-conferences', title: 'Мои конференции', desc: 'Управление мероприятиями', roles: ['organizer', 'admin'] },
  { href: '/profile', title: 'Профиль', desc: 'Личные данные', roles: ['user', 'reviewer', 'organizer', 'admin'] },
];

function DashboardContent() {
  const { user } = useAuth();
  const { data: stats } = useDashboardStats();
  const { data: myPapers = [] } = useMyPapers();
  const canManage = user?.role === 'organizer' || user?.role === 'admin';
  const { data: myConferences = [] } = useMyConferences(canManage);
  const papers = myPapers.slice(0, 3);
  const conferences = myConferences.slice(0, 3);

  if (!user) return null;

  return (
    <>
      <PageHeader
        title={`Здравствуйте, ${user.full_name}`}
        description={`${user.email} · ${ROLE_LABELS[user.role] || user.role}`}
      />
      <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <article className="stat-card">
          <p className="text-sm text-slate-500">Мои статьи</p>
          <p className="text-2xl font-bold text-brand-700">{stats?.my_papers_count ?? papers.length}</p>
        </article>
        <article className="stat-card">
          <p className="text-sm text-slate-500">Непрочитанные</p>
          <p className="text-2xl font-bold text-brand-700">{stats?.unread_notifications ?? 0}</p>
          {(stats?.unread_notifications ?? 0) > 0 && (
            <Link href="/notifications" className="text-sm font-medium text-brand-600 hover:underline">
              Открыть →
            </Link>
          )}
        </article>
        {canManage && (
          <article className="stat-card">
            <p className="text-sm text-slate-500">Конференции</p>
            <p className="text-2xl font-bold text-brand-700">{stats?.my_conferences_count ?? conferences.length}</p>
          </article>
        )}
        {(user.role === 'reviewer' || user.role === 'organizer' || user.role === 'admin') && (
          <article className="stat-card">
            <p className="text-sm text-slate-500">Рецензии в работе</p>
            <p className="text-2xl font-bold text-brand-700">{stats?.pending_reviews_count ?? '—'}</p>
          </article>
        )}
        {(user.role === 'user' || user.role === 'reviewer') && (
          <article className="stat-card">
            <p className="text-sm text-slate-500">Быстрый старт</p>
            <Link href="/submit-paper" className="text-sm font-medium text-brand-600 hover:underline">
              Подать статью →
            </Link>
          </article>
        )}
        {canManage && (
          <article className="stat-card">
            <p className="text-sm text-slate-500">Управление</p>
            <Link href="/my-conferences" className="text-sm font-medium text-brand-600 hover:underline">
              Мои конференции →
            </Link>
          </article>
        )}
      </section>

      {papers.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-4 text-lg font-semibold">Последние статьи</h2>
          <ul className="space-y-2">
            {papers.map((p) => (
              <li key={p.id}>
                <Link href={`/papers/${p.id}`} className="section-card flex items-center justify-between gap-4 py-3">
                  <span className="font-medium">{p.title}</span>
                  <StatusBadge status={p.status} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <h2 className="mb-4 text-lg font-semibold">Разделы</h2>
      <ul className="grid gap-4 md:grid-cols-2">
        {LINKS.filter((l) => l.roles.includes(user.role)).map((l) => (
          <li key={l.href}>
            <Link href={l.href}>
              <Card className="hover:border-brand-300">
                <h3 className="font-semibold text-brand-700">{l.title}</h3>
                <p className="text-sm text-slate-600">{l.desc}</p>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

export default function DashboardPage() {
  return (
    <RequireAuth>
      <DashboardContent />
    </RequireAuth>
  );
}
