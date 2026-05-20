'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useConference, useUpdateConference } from '@/lib/queries';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { PageHeader } from '@/components/ui/PageHeader';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ConferenceForm } from '@/components/conferences/ConferenceForm';
import { conferenceFormSchema, toConferencePayload, type ConferenceFormValues } from '@/lib/validation';
import { getApiErrorMessage } from '@/lib/errors';

function EditConferenceForm() {
  const { id } = useParams();
  const router = useRouter();
  const conferenceQuery = useConference(id as string);
  const updateConferenceMutation = useUpdateConference(id as string);
  const {
    register,
    handleSubmit,
    reset,
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
      status: 'submission_open',
      registration_fee: '',
      submission_fee: '',
      fee_required: false,
      early_bird_fee: '',
      early_bird_deadline: '',
      review_mode: 'open',
    },
  });

  useEffect(() => {
    const c = conferenceQuery.data;
    if (c) {
      reset({
        title: c.title,
        short_name: c.short_name || '',
        description: c.description || '',
        topics: (c.topics || []).join(', '),
        start_date: c.start_date,
        end_date: c.end_date,
        submission_deadline: c.submission_deadline.slice(0, 16),
        review_deadline: c.review_deadline.slice(0, 16),
        location: c.location || '',
        format: c.format as ConferenceFormValues['format'],
        status: c.status as ConferenceFormValues['status'],
        registration_fee: c.registration_fee != null ? String(c.registration_fee) : '',
        submission_fee: c.submission_fee != null ? String(c.submission_fee) : '',
        fee_required: !!c.fee_required,
        early_bird_fee: c.early_bird_fee != null ? String(c.early_bird_fee) : '',
        early_bird_deadline: c.early_bird_deadline ? c.early_bird_deadline.slice(0, 16) : '',
        review_mode: (c.review_mode || 'open') as ConferenceFormValues['review_mode'],
      });
    }
  }, [conferenceQuery.data, reset]);

  const onSubmit = async (values: ConferenceFormValues) => {
    try {
      await updateConferenceMutation.mutateAsync(toConferencePayload(values));
      router.push(`/conference-manage/${id}`);
    } catch (err) {
      setError('root', { message: getApiErrorMessage(err, 'Ошибка сохранения') });
    }
  };

  if (conferenceQuery.isLoading) return <LoadingSpinner />;

  return (
    <>
      <PageHeader title="Редактирование конференции" breadcrumbs={[{ label: 'Управление', href: `/conference-manage/${id}` }, { label: 'Редактирование' }]} />
      <ConferenceForm
        register={register}
        handleSubmit={handleSubmit}
        errors={errors}
        isSubmitting={isSubmitting}
        onSubmit={onSubmit}
        submitLabel="Сохранить"
        submittingLabel="Сохранение..."
        showFees
      />
    </>
  );
}

export default function EditConferencePage() {
  return (
    <RequireAuth roles={['organizer', 'admin']}>
      <EditConferenceForm />
    </RequireAuth>
  );
}
