'use client';

import type { ProceedingsEntry, ProceedingsIssue } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface ProceedingsEntriesEditorProps {
  issue: ProceedingsIssue;
  saving: boolean;
  onSave: (entryId: number, formData: FormData) => Promise<void>;
  onRemove: (entryId: number) => void;
}

function ProceedingsEntryForm({
  entry,
  doiPrefix,
  saving,
  onSave,
  onRemove,
}: {
  entry: ProceedingsEntry;
  doiPrefix?: string;
  saving: boolean;
  onSave: (formData: FormData) => Promise<void>;
  onRemove: () => void;
}) {
  return (
    <li className="rounded-lg border p-4">
      <form action={onSave} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input name="published_title" label="Заголовок" defaultValue={entry.published_title || entry.paper_title || ''} />
          <Input name="doi" label="DOI статьи" defaultValue={entry.doi || ''} placeholder={doiPrefix ? `${doiPrefix}/${entry.paper_id}` : ''} />
          <Input name="pages" label="Страницы" defaultValue={entry.pages || ''} placeholder="12-20" />
          <Input name="order" label="Порядок" type="number" defaultValue={entry.order} />
        </div>
        <Textarea name="published_abstract" label="Аннотация" rows={3} defaultValue={entry.published_abstract || entry.paper_abstract || ''} />
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={saving}>
            Сохранить запись
          </Button>
          <Button type="button" variant="ghost" onClick={onRemove}>
            Удалить
          </Button>
        </div>
      </form>
    </li>
  );
}

export function ProceedingsEntriesEditor({ issue, saving, onSave, onRemove }: ProceedingsEntriesEditorProps) {
  return (
    <Card>
      <h2 className="mb-4 font-semibold">Записи сборника</h2>
      {issue.entries.length === 0 ? (
        <p className="text-sm text-slate-500">Добавьте принятую статью, чтобы сформировать выпуск.</p>
      ) : (
        <ul className="space-y-4">
          {[...issue.entries].sort((a, b) => a.order - b.order).map((entry) => (
            <ProceedingsEntryForm
              key={entry.id}
              entry={entry}
              doiPrefix={issue.doi_prefix}
              saving={saving}
              onSave={(formData) => onSave(entry.id, formData)}
              onRemove={() => onRemove(entry.id)}
            />
          ))}
        </ul>
      )}
    </Card>
  );
}
