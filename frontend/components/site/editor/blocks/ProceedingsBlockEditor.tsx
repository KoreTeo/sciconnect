'use client';

import type { SiteBlock } from '@/lib/types';
import { newBlockId } from '@/lib/siteUtils';
import { SiteDocumentUpload } from '@/components/site/SiteDocumentUpload';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

type Props = {
  conferenceId: string | string[];
  items: SiteBlock['items'];
  onChange: (items: NonNullable<SiteBlock['items']>) => void;
};

export function ProceedingsBlockEditor({ conferenceId, items, onChange }: Props) {
  const list = items || [];

  const updateItem = (idx: number, patch: Partial<NonNullable<SiteBlock['items']>[number]>) => {
    onChange(list.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };

  return (
    <div className="mt-3 space-y-4">
      {list.map((item, i) => (
        <div key={item.id || i} className="space-y-2 rounded-lg border p-3">
          <Input
            label="Год"
            type="number"
            value={item.year ?? ''}
            onChange={(e) => updateItem(i, { year: Number(e.target.value) || undefined, id: item.id || newBlockId() })}
          />
          <Input
            label="Название"
            value={item.title || ''}
            onChange={(e) => updateItem(i, { title: e.target.value })}
          />
          <SiteDocumentUpload
            conferenceId={conferenceId}
            onUploaded={({ url, file_name }) =>
              updateItem(i, { file_url: url, file_name, id: item.id || newBlockId() })
            }
          />
          {item.file_name && <p className="text-xs text-slate-500">Файл: {item.file_name}</p>}
          <Button type="button" variant="ghost" onClick={() => onChange(list.filter((_, j) => j !== i))}>
            Удалить
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="secondary"
        onClick={() => onChange([...list, { id: newBlockId(), year: new Date().getFullYear(), title: '' }])}
      >
        Добавить сборник
      </Button>
    </div>
  );
}
