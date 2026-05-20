'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import api from '@/lib/api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { PageHeader } from '@/components/ui/PageHeader';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { resetPasswordSchema, type ResetPasswordFormValues } from '@/lib/validation';

function ResetForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get('token') || '';
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '' },
  });

  const onSubmit = async (values: ResetPasswordFormValues) => {
    if (!token) {
      setError('root', { message: 'Токен не указан' });
      return;
    }
    try {
      await api.post('/auth/reset-password', { token, new_password: values.password });
      router.push('/login');
    } catch {
      setError('root', { message: 'Ссылка недействительна или истекла' });
    }
  };

  return (
    <Card className="mx-auto max-w-md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Новый пароль"
          type="password"
          error={errors.password?.message}
          {...register('password')}
        />
        {errors.root?.message && <Alert variant="error">{errors.root.message}</Alert>}
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Сохранение...' : 'Сохранить пароль'}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm">
        <Link href="/login" className="text-brand-600 hover:underline">
          Вход
        </Link>
      </p>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <>
      <PageHeader title="Новый пароль" />
      <Suspense fallback={<LoadingSpinner />}>
        <ResetForm />
      </Suspense>
    </>
  );
}
