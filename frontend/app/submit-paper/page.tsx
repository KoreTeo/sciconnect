'use client';

import { Suspense } from 'react';
import { SubmitPaperForm } from '@/components/papers/SubmitPaperForm';
import { SubmissionStepper } from '@/components/papers/SubmissionStepper';
import { EmailVerificationCallout } from '@/components/auth/EmailVerificationCallout';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ProfileReminder } from '@/components/profile/ProfileReminder';
import { useSubmitPaperPageState } from '@/hooks/useSubmitPaperPageState';

function SubmitForm() {
  const state = useSubmitPaperPageState();

  if (state.paperQuery.isLoading) return <LoadingSpinner />;

  return (
    <>
      <PageHeader
        title={state.isRevision ? 'Новая версия статьи' : state.paperId ? 'Редактирование статьи' : 'Новая статья'}
        description={
          state.isRevision
            ? 'Загрузите исправленный PDF и отправьте статью повторно'
            : 'Сохраните черновик, затем загрузите PDF и отправьте на рецензирование'
        }
        breadcrumbs={[{ label: 'Мои статьи', href: '/my-papers' }, { label: state.paperId ? 'Редактирование' : 'Подача' }]}
      />
      <ProfileReminder />
      <EmailVerificationCallout />
      {state.isRevision && (
        <Alert variant="warning" className="mb-6 max-w-2xl">
          Это повторная подача после запроса доработки. Новая загрузка PDF сохранится в истории версий.
        </Alert>
      )}
      <SubmissionStepper
        currentStep={state.currentStep}
        paperStatus={state.paperStatus}
        submissionDeadline={state.conference?.submission_deadline}
        paymentHint={
          state.conference?.fee_required && (state.conference.submission_fee || 0) > 0
            ? `Перед подачей потребуется оплатить взнос ${state.conference.submission_fee} ₽.`
            : undefined
        }
      />
      <Card className="max-w-2xl">
        <SubmitPaperForm
          control={state.control}
          register={state.register}
          errors={state.errors}
          coAuthors={state.coAuthors}
          onCoAuthorsChange={state.setCoAuthors}
          canEditMeta={state.canEditMeta}
          canSubmit={state.canSubmit}
          isRevision={state.isRevision}
          paperId={state.paperId}
          existingPaperId={state.existingPaperId}
          saving={state.saving}
          success={state.success}
          autosaveHint={state.canEditMeta ? state.autosaveHint : undefined}
          tracks={state.tracks}
          onSaveDraft={state.handleSubmit(state.handleSaveDraft)}
          onSubmitPaper={state.handleSubmit(state.submitPaper)}
          onFileChange={state.setFile}
          hasExistingFile={Boolean(state.paper?.file_url || state.paperFileUrl) && !state.file}
        />
      </Card>
    </>
  );
}

export default function SubmitPaperPage() {
  return (
    <RequireAuth>
      <Suspense fallback={<LoadingSpinner />}>
        <SubmitForm />
      </Suspense>
    </RequireAuth>
  );
}
