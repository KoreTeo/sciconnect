'use client';

import type { ProceedingsIssue } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface ProceedingsMetadataFormProps {
  issue: ProceedingsIssue;
  saving: boolean;
  onSave: (formData: FormData) => Promise<void>;
}

export function ProceedingsMetadataForm({ issue, saving, onSave }: ProceedingsMetadataFormProps) {
  return (
    <Card>
      <h2 className="mb-4 font-semibold">Метаданные выпуска</h2>
      <form action={onSave} className="space-y-3">
        <Input name="title" label="Название выпуска" defaultValue={issue.title} />
        <Textarea name="description" label="Описание" rows={3} defaultValue={issue.description || ''} />
        <Input name="isbn" label="ISBN" defaultValue={issue.isbn || ''} />
        <Input name="doi_prefix" label="DOI prefix" defaultValue={issue.doi_prefix || ''} placeholder="10.1234/sciconnect" />
        <Button type="submit" disabled={saving}>
          {saving ? 'Сохранение...' : 'Сохранить'}
        </Button>
      </form>
    </Card>
  );
}
