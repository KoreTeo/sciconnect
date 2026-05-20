'use client';

import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Conference, Paper } from '@/lib/types';
import { queryKeys } from '@/lib/queryKeys';
import { getApiErrorMessage } from '@/lib/errors';
import type { PaperDraftFormValues } from '@/lib/validation';
import { useConference, useConfirmDemoPayment, useCreatePayment, useSubmitPaper, useUploadPaperFile } from '@/lib/queries';

interface SubmitPaperFlowOptions {
  conferenceId?: string | number;
  conference?: Conference | null;
  onError: (message: string) => void;
}

export function useSubmitPaperFlow({ conferenceId, conference, onError }: SubmitPaperFlowOptions) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const cachedConferenceQuery = useConference(conference ? undefined : conferenceId);
  const uploadMutation = useUploadPaperFile();
  const submitMutation = useSubmitPaper();
  const createPaymentMutation = useCreatePayment();
  const confirmDemoPaymentMutation = useConfirmDemoPayment();

  const runSubmit = async (
    paperId: number,
    values: PaperDraftFormValues,
    file: File | null,
    existingFileUrl?: string
  ) => {
    try {
      if (file) {
        await uploadMutation.mutateAsync({ paperId, file });
      }

      const paperRes = await queryClient.fetchQuery({
        queryKey: queryKeys.papers.detail(paperId),
        queryFn: async () => (await api.get<Paper>(`/papers/${paperId}`)).data,
      });
      if (!file && !existingFileUrl && !paperRes.file_url) {
        throw new Error('Загрузите PDF перед подачей');
      }

      const conf =
        conference ||
        cachedConferenceQuery.data ||
        (values.conference_id
          ? await queryClient.fetchQuery({
              queryKey: queryKeys.conferences.detail(values.conference_id),
              queryFn: async () => (await api.get<Conference>(`/conferences/${values.conference_id}`)).data,
            })
          : null);

      const needsPayment = conf?.fee_required && (conf.submission_fee || 0) > 0;
      if (needsPayment && conf) {
        const payment = await createPaymentMutation.mutateAsync({
          conference_id: Number(values.conference_id),
          paper_id: paperId,
          purpose: 'submission',
        });
        if (payment.provider === 'demo') {
          await confirmDemoPaymentMutation.mutateAsync(payment.id);
        } else if (payment.payment_url) {
          router.push(payment.payment_url);
          return;
        } else {
          router.push(`/payments/${payment.id}`);
          return;
        }
      }

      await submitMutation.mutateAsync(paperId);
      router.push(`/papers/${paperId}`);
    } catch (err) {
      const message =
        err instanceof Error && err.message === 'Загрузите PDF перед подачей'
          ? err.message
          : getApiErrorMessage(err, 'Ошибка загрузки или подачи');
      onError(message);
      throw err;
    }
  };

  return { runSubmit };
}
