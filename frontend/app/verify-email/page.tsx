'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

function VerifyEmailContent() {
  const params = useSearchParams();
  const router = useRouter();
  const { refreshUser } = useAuth();
  const token = params.get('token') || '';
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Ссылка подтверждения не содержит токен.');
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        await api.post('/auth/verify-email', { token });
        await refreshUser();
        if (!cancelled) {
          setStatus('success');
          setMessage('Email подтверждён. Теперь доступны подача статей и регистрация на конференции.');
        }
      } catch {
        if (!cancelled) {
          setStatus('error');
          setMessage('Ссылка недействительна или истекла. Запросите новое письмо в профиле.');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, refreshUser]);

  return (
    <Card className="mx-auto max-w-md">
      {status === 'loading' && (
        <div className="flex flex-col items-center gap-3 py-6">
          <LoadingSpinner />
          <p className="text-sm text-slate-600">Подтверждаем email...</p>
        </div>
      )}
      {status === 'success' && <Alert variant="success">{message}</Alert>}
      {status === 'error' && <Alert variant="error">{message}</Alert>}
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <Button type="button" onClick={() => router.push('/dashboard')}>
          В кабинет
        </Button>
        <Link href="/profile" className="text-sm text-brand-600 hover:underline self-center">
          Профиль
        </Link>
      </div>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <>
      <PageHeader title="Подтверждение email" />
      <Suspense fallback={<LoadingSpinner />}>
        <VerifyEmailContent />
      </Suspense>
    </>
  );
}
