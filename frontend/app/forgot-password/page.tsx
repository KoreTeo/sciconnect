'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import api from '@/lib/api';
import { Input, FormRequiredHint } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { PageHeader } from '@/components/ui/PageHeader';
import { forgotPasswordSchema, type ForgotPasswordFormValues } from '@/lib/validation';

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    try {
      await api.post('/auth/forgot-password', values);
      setSent(true);
    } catch {
      setError('root', { message: 'Не удалось отправить письмо' });
    }
  };

  return (
    <>
      <PageHeader title="Восстановление пароля" />
      <Card className="mx-auto max-w-md">
        {sent ? (
          <Alert variant="success">
            Если аккаунт существует, на указанный email отправлена ссылка для сброса пароля.
          </Alert>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FormRequiredHint />
            <Input label="Email" type="email" required error={errors.email?.message} {...register('email')} />
            {errors.root?.message && <Alert variant="error">{errors.root.message}</Alert>}
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Отправка...' : 'Отправить ссылку'}
            </Button>
          </form>
        )}
        <p className="mt-4 text-center text-sm">
          <Link href="/login" className="text-brand-600 hover:underline">
            ← Назад ко входу
          </Link>
        </p>
      </Card>
    </>
  );
}
