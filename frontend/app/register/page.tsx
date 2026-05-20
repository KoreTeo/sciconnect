'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/lib/auth';
import { Input, Select, FormRequiredHint } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { getApiErrorMessage } from '@/lib/errors';
import { registerSchema, toRegisterPayload, type RegisterFormValues } from '@/lib/validation';
import { COUNTRY_SELECT_OPTIONS } from '@/lib/countries';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const {
    register: field,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      full_name: '',
      affiliation: '',
      orcid: '',
      phone: '',
      position: '',
      country: '',
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    try {
      await register(toRegisterPayload(values));
      router.push('/dashboard?verify=1');
    } catch (err) {
      setError('root', { message: getApiErrorMessage(err, 'Ошибка регистрации. Возможно, email уже занят.') });
    }
  };

  return (
    <Card className="mx-auto max-w-lg">
      <h1 className="mb-2 text-2xl font-bold">Регистрация участника</h1>
      <p className="mb-6 text-sm text-slate-600">
        Для подачи статей на конференции. После регистрации мы отправим письмо для подтверждения email.{' '}
        <Link href="/register/organizer" className="text-brand-600 hover:underline">
          Регистрация организатора →
        </Link>
      </p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormRequiredHint />
        <Input
          label="ФИО"
          required
          error={errors.full_name?.message}
          {...field('full_name')}
        />
        <Input
          label="Email"
          type="text"
          required
          autoComplete="email"
          error={errors.email?.message}
          {...field('email')}
        />
        <Input
          label="Пароль"
          type="password"
          required
          error={errors.password?.message}
          {...field('password')}
        />
        <Input
          label="Организация / вуз"
          required
          error={errors.affiliation?.message}
          {...field('affiliation')}
        />
        <Select label="Страна" error={errors.country?.message} {...field('country')}>
          <option value="">Не указана</option>
          {COUNTRY_SELECT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <Input
          label="Должность, учёная степень"
          placeholder="например, аспирант, доцент"
          error={errors.position?.message}
          {...field('position')}
        />
        <Input
          label="ORCID"
          placeholder="0000-0000-0000-0000"
          error={errors.orcid?.message}
          {...field('orcid')}
        />
        <Input
          label="Телефон"
          type="tel"
          error={errors.phone?.message}
          {...field('phone')}
        />
        {errors.root?.message && <p className="text-sm text-red-600">{errors.root.message}</p>}
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Регистрация...' : 'Создать аккаунт участника'}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-600">
        Уже есть аккаунт? <Link href="/login" className="text-brand-600 hover:underline">Войти</Link>
      </p>
    </Card>
  );
}
