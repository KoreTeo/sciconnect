'use client';

import { useMemo, useState } from 'react';
import {
  useAssignReviewer,
  useBulkRequestPaperRevision,
  useConferencePapers,
  useConferenceReviewers,
  usePaperReviews,
  useRequestPaperRevision,
  useReviewAssignments,
  useUnassignReview,
  usePaperDecision,
} from '@/lib/queries';
import {
  fetchConferencePapersCsv,
  fetchConferenceReviewsCsv,
} from '@/lib/queries/exports';

export function useManagePapersTabState(
  conferenceId: string,
  options?: { onMessage?: (message: string) => void }
) {
  const [expandedPaper, setExpandedPaper] = useState<number | null>(null);
  const [paperFilter, setPaperFilter] = useState('');
  const [paperSearch, setPaperSearch] = useState('');
  const [sortBy, setSortBy] = useState<'submitted_desc' | 'title'>('submitted_desc');
  const [selectedPaperIds, setSelectedPaperIds] = useState<number[]>([]);
  const [bulkRevisionComment, setBulkRevisionComment] = useState('');
  const [revisionComments, setRevisionComments] = useState<Record<number, string>>({});
  const [assign, setAssign] = useState<Record<number, string>>({});

  const papersQuery = useConferencePapers(conferenceId, { limit: 100 });
  const reviewersQuery = useConferenceReviewers(conferenceId);
  const reviewAssignmentsQuery = useReviewAssignments(conferenceId);
  const assignReviewerMutation = useAssignReviewer(conferenceId);
  const unassignReviewMutation = useUnassignReview(conferenceId);
  const requestRevisionMutation = useRequestPaperRevision();
  const bulkRevisionMutation = useBulkRequestPaperRevision(conferenceId);
  const decisionMutation = usePaperDecision(conferenceId);
  const reviewsQuery = usePaperReviews(expandedPaper ?? undefined, !!expandedPaper);

  const papers = papersQuery.data || [];
  const reviewers = reviewersQuery.data || [];
  const reviewAssignments = reviewAssignmentsQuery.data || [];
  const assignmentsByPaper = useMemo(
    () => Object.fromEntries(reviewAssignments.map((item) => [item.paper_id, item])),
    [reviewAssignments]
  );

  const filteredPapers = useMemo(() => {
    const q = paperSearch.trim().toLowerCase();
    const list = papers.filter((p) => {
      if (paperFilter && p.status !== paperFilter) return false;
      if (!q) return true;
      return `${p.title} ${p.author_name || ''} ${p.author_id}`.toLowerCase().includes(q);
    });
    return [...list].sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title, 'ru');
      const aTime = a.submitted_at ? new Date(a.submitted_at).getTime() : 0;
      const bTime = b.submitted_at ? new Date(b.submitted_at).getTime() : 0;
      return bTime - aTime;
    });
  }, [paperFilter, paperSearch, papers, sortBy]);

  const assignReviewer = async (paperId: number) => {
    const userId = assign[paperId];
    if (!userId) return;
    await assignReviewerMutation.mutateAsync({ userId: Number(userId), paperId });
    options?.onMessage?.('Рецензент назначен');
  };

  const bulkRequestRevision = async () => {
    const comment = bulkRevisionComment.trim();
    if (comment.length < 5) {
      options?.onMessage?.('Укажите комментарий для доработки (мин. 5 символов)');
      return;
    }
    await bulkRevisionMutation.mutateAsync({ paperIds: selectedPaperIds, comment });
    options?.onMessage?.(`Доработка запрошена для ${selectedPaperIds.length} статей`);
    setSelectedPaperIds([]);
    setBulkRevisionComment('');
  };

  const requestRevision = async (paperId: number) => {
    const comment = (revisionComments[paperId] || '').trim();
    if (comment.length < 5) {
      options?.onMessage?.('Укажите комментарий для доработки');
      return;
    }
    await requestRevisionMutation.mutateAsync({ paperId, comment, conferenceId });
    options?.onMessage?.('Доработка запрошена');
    setRevisionComments((current) => ({ ...current, [paperId]: '' }));
  };

  const togglePaperSelection = (paperId: number) => {
    setSelectedPaperIds((current) =>
      current.includes(paperId) ? current.filter((pid) => pid !== paperId) : [...current, paperId]
    );
  };

  return {
    filteredPapers,
    reviewers,
    assignmentsByPaper,
    paperReviews: reviewsQuery.data || [],
    expandedPaper,
    paperFilter,
    paperSearch,
    sortBy,
    selectedPaperIds,
    bulkRevisionComment,
    revisionComments,
    assign,
    assignReviewerMutation,
    unassignReviewMutation,
    requestRevisionMutation,
    bulkRevisionMutation,
    decisionMutation,
    setPaperFilter,
    setPaperSearch,
    setSortBy,
    togglePaperSelection,
    setBulkRevisionComment,
    setRevisionComments,
    setAssign,
    setExpandedPaper,
    assignReviewer,
    bulkRequestRevision,
    requestRevision,
    exportPapers: () => fetchConferencePapersCsv(conferenceId),
    exportReviews: () => fetchConferenceReviewsCsv(conferenceId),
    loading: papersQuery.isLoading || reviewersQuery.isLoading,
  };
}
