import { getPaperStatusLabel } from '@/lib/types';
import { normalizePaperStatus } from '@/lib/permissions';

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const key = normalizePaperStatus(status);
  const colors: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-700',
    submitted: 'bg-blue-100 text-blue-700',
    under_review: 'bg-amber-100 text-amber-800',
    accepted: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    revision_required: 'bg-orange-100 text-orange-800',
  };
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium leading-none ${colors[key] || 'bg-slate-100 text-slate-700'}`}
    >
      {label || getPaperStatusLabel(key)}
    </span>
  );
}
