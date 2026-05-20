'use client';

import { formatDateTime } from '@/lib/format';
import type { ProceedingsIssue } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface ProceedingsStatusCardProps {
  issue: ProceedingsIssue;
  onPublish: () => void;
  onUnpublish: () => void;
}

export function ProceedingsStatusCard({ issue, onPublish, onUnpublish }: ProceedingsStatusCardProps) {
  return (
    <Card>
      <p className="mb-2 text-sm text-slate-500">Статус выпуска</p>
      <p className="text-lg font-semibold">{issue.is_published ? 'Опубликован' : 'Черновик'}</p>
      {issue.published_at && <p className="mt-1 text-sm text-slate-500">{formatDateTime(issue.published_at)}</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        {issue.is_published ? (
          <Button variant="secondary" onClick={onUnpublish}>
            Снять публикацию
          </Button>
        ) : (
          <Button onClick={onPublish} disabled={issue.entries.length === 0}>
            Опубликовать
          </Button>
        )}
      </div>
    </Card>
  );
}
