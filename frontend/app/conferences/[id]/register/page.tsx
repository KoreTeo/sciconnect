'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { RegistrationWizard } from '@/components/conferences/RegistrationWizard';
import { useConference } from '@/lib/queries';

function RegisterByConferenceIdContent() {
  const { id } = useParams();
  const conferenceId = id as string;
  const { data: conference, isLoading, error } = useConference(conferenceId);

  if (isLoading) return <LoadingSpinner />;
  if (error || !conference) {
    return <p className="text-red-600">Конференция не найдена</p>;
  }

  return (
    <>
      <PageHeader
        title="Регистрация на конференцию"
        description={conference.title}
        breadcrumbs={[
          { label: 'Каталог', href: '/conferences' },
          {
            label: conference.title,
            href: conference.short_name ? `/c/${conference.short_name}` : `/conferences/${conference.id}`,
          },
          { label: 'Регистрация' },
        ]}
      />
      <Card className="max-w-lg">
        <RegistrationWizard conference={conference} />
      </Card>
    </>
  );
}

export default function RegisterByConferenceIdPage() {
  return (
    <RequireAuth>
      <Suspense fallback={<LoadingSpinner />}>
        <RegisterByConferenceIdContent />
      </Suspense>
    </RequireAuth>
  );
}
