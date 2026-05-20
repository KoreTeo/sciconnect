'use client';

import { useState } from 'react';
import {
  useAddConferenceReviewer,
  useConference,
  useConferenceAnalytics,
  useConferencePapers,
  useConferenceRegistrations,
  useConferenceReviewers,
  useRemoveConferenceReviewer,
  useReviewProgress,
} from '@/lib/queries';
import {
  fetchConferenceRegistrationsCsv,
} from '@/lib/queries/exports';

export function useManageConferenceState(conferenceId: string) {
  const [tab, setTab] = useState('papers');
  const [msg, setMsg] = useState('');

  const confQuery = useConference(conferenceId);
  const needsPapers = tab === 'overview';
  const needsReviewers = tab === 'reviewers';
  const needsRegistrations = tab === 'participants' || tab === 'overview';
  const papersQuery = useConferencePapers(conferenceId, { limit: 100 }, needsPapers);
  const reviewersQuery = useConferenceReviewers(conferenceId, needsReviewers);
  const registrationsQuery = useConferenceRegistrations(conferenceId, needsRegistrations);
  const reviewProgressQuery = useReviewProgress(conferenceId);
  const analyticsQuery = useConferenceAnalytics(conferenceId, tab === 'overview');
  const addReviewerBase = useAddConferenceReviewer(conferenceId);
  const addReviewerMutation = {
    ...addReviewerBase,
    mutateAsync: async (userId: number) => {
      const result = await addReviewerBase.mutateAsync(userId);
      setMsg('Рецензент добавлен в пул');
      return result;
    },
  };
  const removeReviewerMutation = useRemoveConferenceReviewer(conferenceId);

  const conf = confQuery.data;
  const papers = papersQuery.data || [];
  const reviewers = reviewersQuery.data || [];
  const registrations = registrationsQuery.data || [];
  const reviewProgress = reviewProgressQuery.data;

  const loading =
    confQuery.isLoading ||
    (needsPapers && papersQuery.isLoading) ||
    (needsReviewers && reviewersQuery.isLoading) ||
    (needsRegistrations && registrationsQuery.isLoading);

  const error =
    confQuery.error ||
    (needsPapers ? papersQuery.error : null) ||
    (needsReviewers ? reviewersQuery.error : null) ||
    (needsRegistrations ? registrationsQuery.error : null);

  return {
    tab,
    setTab,
    msg,
    setMsg,
    conf,
    papers,
    reviewers,
    registrations,
    reviewProgress,
    analyticsQuery,
    loading,
    error,
    addReviewerMutation,
    removeReviewerMutation,
    exportRegistrations: () => fetchConferenceRegistrationsCsv(conferenceId),
  };
}
