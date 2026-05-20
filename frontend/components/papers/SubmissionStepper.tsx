'use client';

import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { SUBMISSION_STEPS } from '@/lib/submitPaperStep';
import { getPaperStatusLabel } from '@/lib/types';
import { formatDateTime } from '@/lib/format';

export function SubmissionStepper({
  currentStep,
  paymentHint,
  paperStatus,
  submissionDeadline,
}: {
  currentStep: number;
  paymentHint?: string;
  paperStatus?: string;
  submissionDeadline?: string;
}) {
  return (
    <Card className="mb-6 max-w-2xl">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        {paperStatus && <StatusBadge status={paperStatus} label={getPaperStatusLabel(paperStatus)} />}
        {submissionDeadline && (
          <p className="text-xs text-slate-500">Дедлайн подачи: {formatDateTime(submissionDeadline)}</p>
        )}
      </div>
      <ol className="grid gap-2 sm:grid-cols-4">
        {SUBMISSION_STEPS.map((step, index) => {
          const number = index + 1;
          const active = number <= currentStep;
          const current = number === currentStep;
          return (
            <li
              key={step}
              className={`rounded-lg border px-3 py-2 text-sm ${
                current
                  ? 'border-brand-400 bg-brand-100 text-brand-900'
                  : active
                    ? 'border-brand-200 bg-brand-50 text-brand-800'
                    : 'border-slate-200 text-slate-500'
              }`}
            >
              <span className="font-semibold">{number}. </span>
              {step}
            </li>
          );
        })}
      </ol>
      {paymentHint && <p className="mt-3 text-xs text-slate-500">{paymentHint}</p>}
    </Card>
  );
}
