'use client';

import { fetchProceedingsCsv } from '@/lib/queries/exports';
import { getApiBaseUrl } from '@/lib/urls';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface ProceedingsExportCardProps {
  conferenceId: string;
  entriesCount: number;
}

export function ProceedingsExportCard({ conferenceId, entriesCount }: ProceedingsExportCardProps) {
  return (
    <Card>
      <h2 className="mb-4 font-semibold">Экспорт метаданных</h2>
      <p className="mb-3 text-sm text-slate-600">Записей в export: {entriesCount}</p>
      <div className="flex flex-wrap gap-2">
        <a
          href={`${getApiBaseUrl()}/conferences/${conferenceId}/proceedings/export`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button variant="secondary">Скачать JSON</Button>
        </a>
        <Button variant="secondary" onClick={() => fetchProceedingsCsv(conferenceId)}>
          CSV
        </Button>
      </div>
    </Card>
  );
}
