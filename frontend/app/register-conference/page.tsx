'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { RegistrationWizard } from '@/components/conferences/RegistrationWizard';
import { useConference } from '@/lib/queries';

function RegisterConferenceContent() {
  const params = useSearchParams();
  const conferenceId = params.get('conferenceId') || undefined;
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

export default function RegisterConferencePage() {
  return (
    <RequireAuth>
      <Suspense fallback={<LoadingSpinner />}>
        <RegisterConferenceContent />
      </Suspense>
    </RequireAuth>
  );
}
