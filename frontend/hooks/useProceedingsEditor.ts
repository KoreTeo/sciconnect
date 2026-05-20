'use client';

import { fetchProceedingsCsv } from '@/lib/queries/exports';
import {
  useAddProceedingsEntry,
  useConferenceProceedings,
  usePublishProceedings,
  useRemoveProceedingsEntry,
  useUnpublishProceedings,
  useUpdateProceedings,
  useUpdateProceedingsEntry,
} from '@/lib/queries/proceedings';

export function useProceedingsEditor(conferenceId: string) {
  const proceedingsQuery = useConferenceProceedings(conferenceId);
  const updateIssue = useUpdateProceedings(conferenceId);
  const addEntry = useAddProceedingsEntry(conferenceId);
  const updateEntry = useUpdateProceedingsEntry(conferenceId);
  const removeEntry = useRemoveProceedingsEntry(conferenceId);
  const publish = usePublishProceedings(conferenceId);
  const unpublish = useUnpublishProceedings(conferenceId);

  const saveIssue = async (formData: FormData) => {
    await updateIssue.mutateAsync({
      title: String(formData.get('title') || ''),
      description: String(formData.get('description') || ''),
      isbn: String(formData.get('isbn') || ''),
      doi_prefix: String(formData.get('doi_prefix') || ''),
    });
  };

  const saveEntry = async (entryId: number, formData: FormData) => {
    await updateEntry.mutateAsync({
      entryId,
      patch: {
        published_title: String(formData.get('published_title') || ''),
        published_abstract: String(formData.get('published_abstract') || ''),
        doi: String(formData.get('doi') || ''),
        pages: String(formData.get('pages') || ''),
        order: Number(formData.get('order') || 0),
      },
    });
  };

  const showSuccess =
    updateIssue.isSuccess ||
    addEntry.isSuccess ||
    updateEntry.isSuccess ||
    publish.isSuccess ||
    unpublish.isSuccess;

  return {
    issue: proceedingsQuery.data,
    proceedingsQuery,
    updateIssue,
    addEntry,
    updateEntry,
    removeEntry,
    publish,
    unpublish,
    saveIssue,
    saveEntry,
    downloadCsv: () => fetchProceedingsCsv(conferenceId),
    showSuccess,
  };
}
