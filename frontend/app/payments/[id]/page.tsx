'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PAYMENT_STATUS_LABELS } from '@/lib/types';
import { getApiErrorMessage } from '@/lib/errors';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useConfirmPayment, usePayment } from '@/lib/queries';

function PaymentContent() {
  const { id } = useParams();
  const router = useRouter();
  const paymentQuery = usePayment(id as string);
  const confirmPayment = useConfirmPayment(id as string);
  const payment = paymentQuery.data;
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const confirm = async () => {
    try {
      setConfirmError(null);
      await confirmPayment.mutateAsync();
    } catch (err) {
      setConfirmError(getApiErrorMessage(err, 'Не удалось подтвердить оплату'));
    }
  };

  if (paymentQuery.isLoading) return <LoadingSpinner />;
  if (!payment) {
    return <Alert variant="error">Платёж не найден</Alert>;
  }

  const paid = payment.status === 'paid';
  const isDemo = payment.provider === 'demo';

  return (
    <>
      <PageHeader title="Оплата" description={`Платёж #${payment.id}`} />
      <Card className="max-w-md space-y-4">
        <p>
          <strong>Сумма:</strong> {payment.amount} {payment.currency}
        </p>
        <p>
          <strong>Статус:</strong> {PAYMENT_STATUS_LABELS[payment.status] || payment.status}
        </p>
        <p className="text-sm text-slate-500">
          Провайдер: {isDemo ? 'Демо' : payment.provider}
        </p>
        {confirmError && <Alert variant="error">{confirmError}</Alert>}
        {paid ? (
          <Alert variant="success">Оплата прошла успешно (демо).</Alert>
        ) : isDemo ? (
          <Button onClick={confirm} disabled={confirmPayment.isPending}>
            {confirmPayment.isPending ? 'Обработка...' : 'Оплатить (демо)'}
          </Button>
        ) : payment.payment_url ? (
          <a href={payment.payment_url}>
            <Button>Перейти к оплате</Button>
          </a>
        ) : (
          <Alert variant="info">Платёж создан. Ожидаем подтверждение от платёжного провайдера.</Alert>
        )}
        <Button variant="ghost" onClick={() => router.push('/dashboard')}>
          В кабинет
        </Button>
      </Card>
    </>
  );
}

export default function PaymentPage() {
  return (
    <RequireAuth>
      <PaymentContent />
    </RequireAuth>
  );
}
