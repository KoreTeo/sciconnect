'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import api from '@/lib/api';
import { Input, FormRequiredHint } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { getApiErrorMessage } from '@/lib/errors';
import { useAuth } from '@/lib/auth';
import {
  organizerRegisterSchema,
  toOrganizerRegisterPayload,
  type OrganizerRegisterFormValues,
} from '@/lib/validation';

export default function RegisterOrganizerPage() {
  const { login } = useAuth();
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<OrganizerRegisterFormValues>({
    resolver: zodResolver(organizerRegisterSchema),
    defaultValues: {
      email: '',
      password: '',
      full_name: '',
      organization: '',
      phone: '',
      website: '',
      position: '',
    },
  });

  const onSubmit = async (values: OrganizerRegisterFormValues) => {
    try {
      await api.post('/auth/register/organizer', toOrganizerRegisterPayload(values));
      await login(values.email, values.password);
      router.push('/my-conferences?verify=1');
    } catch (err) {
      setError('root', { message: getApiErrorMessage(err, 'Ошибка регистрации организатора') });
    }
  };

  return (
    <Card className="mx-auto max-w-lg">
      <h1 className="mb-2 text-2xl font-bold">Регистрация организатора</h1>
      <p className="mb-6 text-sm text-slate-600">
        Создание и управление конференциями, рецензированием и сайтом мероприятия. На email придёт ссылка для подтверждения.{' '}
        <Link href="/register" className="text-brand-600 hover:underline">
          Регистрация участника →
        </Link>
      </p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormRequiredHint />
        <Input
          label="ФИО контактного лица"
          required
          error={errors.full_name?.message}
          {...register('full_name')}
        />
        <Input
          label="Email"
          type="text"
          required
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Пароль"
          type="password"
          required
          error={errors.password?.message}
          {...register('password')}
        />
        <Input
          label="Организация-организатор"
          required
          error={errors.organization?.message}
          {...register('organization')}
        />
        <Input
          label="Телефон"
          type="tel"
          required
          error={errors.phone?.message}
          {...register('phone')}
        />
        <Input
          label="Должность"
          error={errors.position?.message}
          {...register('position')}
        />
        <Input
          label="Сайт организации"
          type="url"
          placeholder="https://"
          error={errors.website?.message}
          {...register('website')}
        />
        {errors.root?.message && <p className="text-sm text-red-600">{errors.root.message}</p>}
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Регистрация...' : 'Создать аккаунт организатора'}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-600">
        Уже есть аккаунт? <Link href="/login" className="text-brand-600 hover:underline">Войти</Link>
      </p>
    </Card>
  );
}
