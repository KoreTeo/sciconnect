'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import type { Conference } from '@/lib/types';
import { canRegisterForConference } from '@/lib/permissions';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { getApiErrorMessage } from '@/lib/errors';
import { useConfirmDemoPayment, useCreatePayment, useRegisterForConference } from '@/lib/queries';
import {
  effectiveRegistrationFee,
  isProfileReadyForConferenceRegistration,
  type RegistrationType,
} from '@/lib/registration';

export function RegisterButton({ conference }: { conference: Conference }) {
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();
  const registerMutation = useRegisterForConference(conference.id);
  const createPaymentMutation = useCreatePayment();
  const confirmDemoPaymentMutation = useConfirmDemoPayment();
  const [registrationType, setRegistrationType] = useState<RegistrationType>('listener');
  const [promoCode, setPromoCode] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);

  if (!canRegisterForConference(user, conference)) {
    return null;
  }

  const profileGate = isProfileReadyForConferenceRegistration(user);
  const fee = effectiveRegistrationFee(conference);
  const needsPayment = conference.fee_required && fee > 0;

  if (!profileGate.ready) {
    return (
      <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-4 text-left text-sm text-amber-900">
        {profileGate.missingEmailVerification && (
          <p>Подтвердите email, чтобы зарегистрироваться на конференцию.</p>
        )}
        {profileGate.missingAffiliation && (
          <p>Укажите организацию в профиле перед регистрацией на конференцию.</p>
        )}
        <Link href="/profile" className="font-medium text-brand-600 hover:underline">
          Перейти в профиль →
        </Link>
      </div>
    );
  }

  const handleRegister = async () => {
    if (!acceptTerms) {
      toast.error('Необходимо согласие с условиями участия');
      return;
    }
    try {
      const reg = await registerMutation.mutateAsync({
        registrationType,
        acceptTerms: true,
        promoCode: promoCode.trim() || undefined,
      });
      if (needsPayment) {
        const payment = await createPaymentMutation.mutateAsync({
          conference_id: conference.id,
          registration_id: reg.id,
          purpose: 'registration',
          promo_code: promoCode.trim() || undefined,
        });
        if (payment.provider === 'demo') {
          await confirmDemoPaymentMutation.mutateAsync(payment.id);
          toast.success('Регистрация подтверждена после оплаты');
          return;
        }
        if (payment.payment_url) {
          router.push(payment.payment_url);
          return;
        }
        router.push(`/payments/${payment.id}`);
        return;
      }
      toast.success('Вы зарегистрированы на конференцию');
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Не удалось зарегистрироваться'));
    }
  };

  const pending = registerMutation.isPending || createPaymentMutation.isPending;
  const wizardHref = `/conferences/${conference.id}/register`;

  return (
    <div className="space-y-3 text-left">
      <Select
        label="Тип участия"
        value={registrationType}
        onChange={(event) => setRegistrationType(event.target.value as RegistrationType)}
      >
        <option value="listener">Слушатель</option>
        <option value="author">Автор</option>
      </Select>
      <Input
        label="Промокод (необязательно)"
        value={promoCode}
        onChange={(event) => setPromoCode(event.target.value)}
      />
      <label className="flex items-start gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          className="mt-1"
          checked={acceptTerms}
          onChange={(event) => setAcceptTerms(event.target.checked)}
        />
        <span>
          Согласен с{' '}
          <Link href="/terms" className="text-brand-600 hover:underline" target="_blank">
            условиями участия
          </Link>
        </span>
      </label>
      <Button onClick={handleRegister} disabled={pending || !acceptTerms}>
        {pending ? 'Регистрация...' : needsPayment ? 'Зарегистрироваться и оплатить' : 'Зарегистрироваться'}
      </Button>
      <Link href={wizardHref} className="block text-sm text-brand-600 hover:underline">
        Открыть мастер регистрации →
      </Link>
      {needsPayment ? <p className="text-xs text-slate-500">Взнос: {fee} ₽</p> : null}
    </div>
  );
}
