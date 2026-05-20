'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import type { Conference } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Input, Select, FormRequiredHint } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { getApiErrorMessage } from '@/lib/errors';
import { useConfirmDemoPayment, useCreatePayment, useRegisterForConference } from '@/lib/queries';
import {
  effectiveRegistrationFee,
  isProfileReadyForConferenceRegistration,
  type RegistrationType,
} from '@/lib/registration';

type Step = 'type' | 'promo' | 'confirm' | 'done';

export function RegistrationWizard({ conference }: { conference: Conference }) {
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();
  const registerMutation = useRegisterForConference(conference.id);
  const createPaymentMutation = useCreatePayment();
  const confirmDemoPaymentMutation = useConfirmDemoPayment();
  const [step, setStep] = useState<Step>('type');
  const [registrationType, setRegistrationType] = useState<RegistrationType>('listener');
  const [promoCode, setPromoCode] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);

  const profileGate = isProfileReadyForConferenceRegistration(user);
  const fee = effectiveRegistrationFee(conference);
  const needsPayment = conference.fee_required && fee > 0;

  if (!user) {
    return (
      <p className="text-sm text-slate-600">
        <Link href="/login" className="text-brand-600 hover:underline">
          Войдите
        </Link>
        , чтобы зарегистрироваться на конференцию.
      </p>
    );
  }

  if (!profileGate.ready) {
    return (
      <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        {!user.email_verified && <p>Подтвердите email перед регистрацией.</p>}
        {!user.affiliation?.trim() && <p>Укажите организацию в профиле.</p>}
        <Link href="/profile" className="font-medium text-brand-600 hover:underline">
          Перейти в профиль →
        </Link>
      </div>
    );
  }

  const finishRegistration = async () => {
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
          setStep('done');
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
      setStep('done');
      toast.success('Вы зарегистрированы на конференцию');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Не удалось зарегистрироваться'));
    }
  };

  if (step === 'done') {
    return (
      <div className="space-y-3">
        <p className="text-green-700">Регистрация на «{conference.title}» завершена.</p>
        <Link href="/my-registrations">
          <Button variant="secondary">Мои регистрации</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <FormRequiredHint />
      {step === 'type' && (
        <>
          <Select
            label="Тип участия"
            required
            value={registrationType}
            onChange={(e) => setRegistrationType(e.target.value as RegistrationType)}
          >
            <option value="listener">Слушатель</option>
            <option value="author">Автор</option>
          </Select>
          {needsPayment && <p className="text-sm text-slate-600">Взнос: {fee} ₽</p>}
          <Button onClick={() => setStep('promo')}>Далее</Button>
        </>
      )}
      {step === 'promo' && (
        <>
          <Input
            label="Промокод (необязательно)"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
          />
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setStep('type')}>
              Назад
            </Button>
            <Button onClick={() => setStep('confirm')}>Далее</Button>
          </div>
        </>
      )}
      {step === 'confirm' && (
        <>
          <p className="text-sm text-slate-600">
            Тип: {registrationType === 'author' ? 'Автор' : 'Слушатель'}
            {needsPayment ? ` · Взнос: ${fee} ₽` : ''}
          </p>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" required checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} />
            <span>
              Согласен с{' '}
              <Link href="/terms" className="text-brand-600 hover:underline" target="_blank">
                условиями участия
              </Link>
              <span className="text-red-600" aria-hidden="true"> *</span>
            </span>
          </label>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setStep('promo')}>
              Назад
            </Button>
            <Button
              disabled={!acceptTerms || registerMutation.isPending || createPaymentMutation.isPending}
              onClick={finishRegistration}
            >
              {needsPayment ? 'Зарегистрироваться и оплатить' : 'Подтвердить регистрацию'}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
