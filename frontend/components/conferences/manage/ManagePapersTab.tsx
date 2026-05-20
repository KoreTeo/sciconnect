'use client';

import { ManageBulkRevisionBar } from './ManageBulkRevisionBar';
import { ManagePaperCard } from './ManagePaperCard';
import { ManagePaperFilters } from './ManagePaperFilters';
import type { Conference } from '@/lib/types';
import { useManagePapersTabState } from '@/hooks/useManagePapersTabState';

type Props = {
  conferenceId: string;
  conf?: Conference;
  onMessage?: (message: string) => void;
};

export function ManagePapersTab({ conferenceId, conf, onMessage }: Props) {
  const state = useManagePapersTabState(conferenceId, { onMessage });

  return (
    <>
      <ManagePaperFilters
        paperFilter={state.paperFilter}
        paperSearch={state.paperSearch}
        sortBy={state.sortBy}
        onPaperFilterChange={state.setPaperFilter}
        onPaperSearchChange={state.setPaperSearch}
        onSortByChange={state.setSortBy}
        onExportPapers={state.exportPapers}
        onExportReviews={state.exportReviews}
        selectedCount={state.selectedPaperIds.length}
      />
      {state.selectedPaperIds.length > 0 && (
        <ManageBulkRevisionBar
          bulkRevisionComment={state.bulkRevisionComment}
          pending={state.bulkRevisionMutation.isPending}
          onBulkRevisionCommentChange={state.setBulkRevisionComment}
          onBulkRequestRevision={state.bulkRequestRevision}
        />
      )}
      <ul className="space-y-4">
        {state.filteredPapers.map((p) => (
          <li key={p.id}>
            <ManagePaperCard
              paper={p}
              conf={conf}
              reviewers={state.reviewers}
              assignment={state.assignmentsByPaper[p.id]}
              assignUserId={state.assign[p.id] || ''}
              revisionComment={state.revisionComments[p.id] || ''}
              expanded={state.expandedPaper === p.id}
              showReviews={state.paperReviews.length > 0}
              selected={state.selectedPaperIds.includes(p.id)}
              onToggleSelection={() => state.togglePaperSelection(p.id)}
              onAssignChange={(userId) => state.setAssign({ ...state.assign, [p.id]: userId })}
              onAssignReviewer={() => state.assignReviewer(p.id)}
              onLoadReviews={() => state.setExpandedPaper(p.id)}
              onSetDecision={(status) => state.decisionMutation.mutateAsync({ paperId: p.id, status })}
              onUnassignReview={(reviewId) => state.unassignReviewMutation.mutate(reviewId)}
              onRevisionCommentChange={(value) =>
                state.setRevisionComments((current) => ({ ...current, [p.id]: value }))
              }
              onRequestRevision={() => state.requestRevision(p.id)}
              assignReviewerMutation={state.assignReviewerMutation}
              requestRevisionMutation={state.requestRevisionMutation}
              paperReviews={state.expandedPaper === p.id ? state.paperReviews : []}
            />
          </li>
        ))}
      </ul>
    </>
  );
}
