'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { NotificationBell } from './NotificationBell';

export function Header() {
  const { user, logout, loading } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const linkClass = (href: string) => {
    const active = pathname === href || (href !== '/' && pathname.startsWith(`${href}/`));
    return `rounded-md px-2 py-1 text-slate-600 hover:text-brand-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 ${
      active ? 'bg-brand-50 text-brand-700' : ''
    }`;
  };

  const closeMenu = () => setOpen(false);

  const navLink = (href: string, label: string) => (
    <Link
      href={href}
      className={linkClass(href)}
      aria-current={pathname === href || (href !== '/' && pathname.startsWith(`${href}/`)) ? 'page' : undefined}
      onClick={closeMenu}
    >
      {label}
    </Link>
  );

  const navContent = (
    <>
      {navLink('/conferences', 'Каталог')}
      {!loading && user ? (
        <>
          {navLink('/dashboard', 'Кабинет')}
          {navLink('/my-papers', 'Мои статьи')}
          {user.role !== 'organizer' && user.role !== 'admin' && (
            navLink('/my-registrations', 'Мои регистрации')
          )}
          {(user.role === 'reviewer' || user.role === 'organizer' || user.role === 'admin') && (
            navLink('/reviews', 'Рецензии')
          )}
          {(user.role === 'organizer' || user.role === 'admin') && (
            navLink('/my-conferences', 'Управление')
          )}
          {user.role === 'admin' && navLink('/admin', 'Админ')}
          {navLink('/profile', 'Профиль')}
          <span className="text-slate-500">{user.full_name}</span>
          <Button
            variant="ghost"
            onClick={() => {
              closeMenu();
              logout();
            }}
          >
            Выйти
          </Button>
        </>
      ) : (
        !loading && (
          <>
            {navLink('/login', 'Вход')}
            <Link href="/register" onClick={closeMenu}>
              <Button>Регистрация</Button>
            </Link>
          </>
        )
      )}
    </>
  );

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-4">
        <div className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-3 sm:grid-cols-[auto_1fr_auto]">
          <Link
            href="/"
            className="col-start-1 row-start-1 rounded-md text-xl font-bold text-brand-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
          >
            SciConnect
          </Link>

          <div className="col-start-2 row-start-1 flex items-center justify-end gap-1 sm:col-start-3">
            {!loading && user && <NotificationBell />}
            <button
              type="button"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 sm:hidden"
              aria-expanded={open}
              aria-controls="main-navigation"
              onClick={() => setOpen((value) => !value)}
            >
              Меню
            </button>
          </div>

          <nav
            id="main-navigation"
            className={`col-span-2 row-start-2 flex-col gap-2 border-t border-slate-100 pt-3 text-sm sm:col-span-1 sm:col-start-2 sm:row-start-1 sm:flex sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:gap-4 sm:border-0 sm:pt-0 ${
              open ? 'flex' : 'hidden sm:flex'
            }`}
          >
            {navContent}
          </nav>
        </div>
      </div>
    </header>
  );
}
