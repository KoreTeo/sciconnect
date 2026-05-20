'use client';

import { Card } from '@/components/ui/Card';
import { Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface ManageBulkRevisionBarProps {
  bulkRevisionComment: string;
  pending: boolean;
  onBulkRevisionCommentChange: (value: string) => void;
  onBulkRequestRevision: () => void;
}

export function ManageBulkRevisionBar({
  bulkRevisionComment,
  pending,
  onBulkRevisionCommentChange,
  onBulkRequestRevision,
}: ManageBulkRevisionBarProps) {
  return (
    <Card className="mb-4 space-y-3">
      <Textarea
        label="Комментарий для выбранных статей"
        rows={2}
        value={bulkRevisionComment}
        onChange={(e) => onBulkRevisionCommentChange(e.target.value)}
      />
      <Button variant="secondary" disabled={pending} onClick={onBulkRequestRevision}>
        Запросить доработку для выбранных
      </Button>
    </Card>
  );
}
