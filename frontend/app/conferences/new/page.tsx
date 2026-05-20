'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { PageHeader } from '@/components/ui/PageHeader';
import { ConferenceForm } from '@/components/conferences/ConferenceForm';
import { conferenceFormSchema, toConferencePayload, type ConferenceFormValues } from '@/lib/validation';
import { useCreateConference } from '@/lib/queries';
import { getApiErrorMessage } from '@/lib/errors';

function NewConferenceForm() {
  const router = useRouter();
  const createConferenceMutation = useCreateConference();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ConferenceFormValues>({
    resolver: zodResolver(conferenceFormSchema),
    defaultValues: {
      title: '',
      short_name: '',
      description: '',
      topics: '',
      start_date: '',
      end_date: '',
      submission_deadline: '',
      review_deadline: '',
      location: '',
      format: 'hybrid',
      registration_fee: '',
      submission_fee: '',
      fee_required: false,
    },
  });

  const onSubmit = async (values: ConferenceFormValues) => {
    try {
      const conference = await createConferenceMutation.mutateAsync(toConferencePayload(values));
      router.push(`/conference-manage/${conference.id}`);
    } catch (err) {
      setError('root', { message: getApiErrorMessage(err, 'Ошибка создания. Проверьте краткое имя и даты.') });
    }
  };

  return (
    <>
      <PageHeader
        title="Создание конференции"
        breadcrumbs={[{ label: 'Мои конференции', href: '/my-conferences' }, { label: 'Создание' }]}
      />
      <ConferenceForm
        register={register}
        handleSubmit={handleSubmit}
        errors={errors}
        isSubmitting={isSubmitting}
        onSubmit={onSubmit}
        submitLabel="Создать конференцию"
        submittingLabel="Создание..."
      />
    </>
  );
}

export default function NewConferencePage() {
  return (
    <RequireAuth roles={['organizer', 'admin']}>
      <NewConferenceForm />
    </RequireAuth>
  );
}
