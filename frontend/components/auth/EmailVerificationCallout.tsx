'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { useResendVerification } from '@/hooks/useResendVerification';

export function EmailVerificationCallout() {
  const { user } = useAuth();
  const { resend, message, sending } = useResendVerification();

  if (!user || user.email_verified) {
    return null;
  }

  return (
    <Alert variant="warning" className="mb-6 max-w-2xl">
      <p className="mb-2">
        Подтвердите email <strong>{user.email}</strong>, чтобы сохранять черновики, загружать PDF и подавать статьи.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" disabled={sending} onClick={resend}>
          {sending ? 'Отправка...' : 'Отправить письмо снова'}
        </Button>
        <Link href="/profile" className="text-sm text-brand-700 underline self-center">
          Профиль
        </Link>
      </div>
      {message && <p className="mt-2 text-xs text-green-700">{message}</p>}
    </Alert>
  );
}
