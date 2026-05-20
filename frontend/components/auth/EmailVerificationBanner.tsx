'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { useResendVerification } from '@/hooks/useResendVerification';

export function EmailVerificationBanner() {
  const { user, refreshUser } = useAuth();
  const { resend, message, sending } = useResendVerification();

  if (!user || user.email_verified) {
    return null;
  }

  return (
    <div className="border-b border-amber-200 bg-amber-50">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
        <p className="text-amber-900">
          Подтвердите email <strong>{user.email}</strong>, чтобы подавать статьи и регистрироваться на конференции.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" disabled={sending} onClick={resend}>
            {sending ? 'Отправка...' : 'Отправить снова'}
          </Button>
          <Link href="/profile">
            <Button type="button" variant="ghost">
              Профиль
            </Button>
          </Link>
          <Button type="button" variant="ghost" onClick={() => refreshUser()}>
            Обновить статус
          </Button>
        </div>
      </div>
      {message && <p className="mx-auto max-w-6xl px-4 pb-2 text-xs text-green-700">{message}</p>}
    </div>
  );
}
