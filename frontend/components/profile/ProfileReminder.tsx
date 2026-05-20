'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { Alert } from '@/components/ui/Alert';

export function ProfileReminder() {
  const { user } = useAuth();
  if (!user) return null;

  const missing: string[] = [];
  if (!user.affiliation?.trim()) missing.push('организацию');
  if (!user.full_name?.trim()) missing.push('ФИО');
  if (!user.position?.trim()) missing.push('должность');
  if (!user.orcid?.trim()) missing.push('ORCID');

  if (missing.length === 0) {
    return (
      <Alert variant="info" className="mb-6">
        Перед подачей статьи убедитесь, что{' '}
        <Link href="/profile" className="font-medium underline">
          данные в профиле
        </Link>{' '}
        актуальны — они отображаются в материалах конференции.
      </Alert>
    );
  }

  return (
    <Alert variant="warning" className="mb-6">
      Заполните в{' '}
      <Link href="/profile" className="font-medium underline">
        профиле
      </Link>
      : {missing.join(', ')}. Актуальные данные нужны для подачи и публикации статьи.
    </Alert>
  );
}
