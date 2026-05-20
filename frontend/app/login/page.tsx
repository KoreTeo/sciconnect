'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/lib/auth';
import { Input, FormRequiredHint } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { loginSchema, type LoginFormValues } from '@/lib/validation';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      await login(values.email, values.password);
      const next = new URLSearchParams(window.location.search).get('next');
      const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard';
      router.push(safeNext);
    } catch {
      setError('root', { message: 'Неверный email или пароль' });
    }
  };

  return (
    <Card className="mx-auto max-w-md">
      <h1 className="mb-6 text-2xl font-bold">Вход</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormRequiredHint />
        <Input label="Email" type="text" required autoComplete="email" error={errors.email?.message} {...register('email')} />
        <Input label="Пароль" type="password" required error={errors.password?.message} {...register('password')} />
        {errors.root?.message && <p className="text-sm text-red-600">{errors.root.message}</p>}
        <p className="text-right text-sm">
          <Link href="/forgot-password" className="text-brand-600 hover:underline">
            Забыли пароль?
          </Link>
        </p>
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Вход...' : 'Войти'}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-600">
        Нет аккаунта?{' '}
        <Link href="/register" className="text-brand-600 hover:underline">Участник</Link>
        {' · '}
        <Link href="/register/organizer" className="text-brand-600 hover:underline">Организатор</Link>
      </p>
    </Card>
  );
}
