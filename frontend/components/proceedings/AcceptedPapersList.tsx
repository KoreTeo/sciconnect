'use client';

import type { Paper } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface AcceptedPapersListProps {
  papers: Paper[];
  adding: boolean;
  onAdd: (paperId: number) => void;
}

export function AcceptedPapersList({ papers, adding, onAdd }: AcceptedPapersListProps) {
  return (
    <Card>
      <h2 className="mb-4 font-semibold">Принятые статьи</h2>
      {papers.length === 0 ? (
        <p className="text-sm text-slate-500">Нет новых принятых статей для добавления.</p>
      ) : (
        <ul className="space-y-3">
          {papers.map((paper) => (
            <li key={paper.id} className="flex items-start justify-between gap-4 rounded-lg border p-3">
              <div>
                <p className="font-medium">{paper.title}</p>
                <p className="text-sm text-slate-500">{paper.author_name || `Автор #${paper.author_id}`}</p>
              </div>
              <Button variant="secondary" onClick={() => onAdd(paper.id)} disabled={adding}>
                Добавить
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
