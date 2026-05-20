export function getReviewDeadlineState(deadline?: string): 'ok' | 'soon' | 'overdue' {
  if (!deadline) return 'ok';
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff < 0) return 'overdue';
  if (diff < 3 * 24 * 60 * 60 * 1000) return 'soon';
  return 'ok';
}